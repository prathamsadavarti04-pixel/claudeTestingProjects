import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  workspaceProcedure,
  requirePermission,
} from "../trpc";
import { sendEmail, inviteEmailHtml } from "../lib/email";

const INVITE_TTL_DAYS = 7;

export const inviteRouter = createTRPCRouter({
  list: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.invite.findMany({
        where: { workspaceId: input.workspaceId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: workspaceProcedure
    .use(requirePermission("members:invite"))
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string().email(),
        role: z.enum(["ADMIN", "DEVELOPER", "REVIEWER"]).default("DEVELOPER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingMember = await ctx.prisma.workspaceMember.findFirst({
        where: { workspaceId: input.workspaceId, user: { email: input.email } },
      });
      if (existingMember) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That person is already a member." });
      }

      const [workspace, inviter] = await Promise.all([
        ctx.prisma.workspace.findUniqueOrThrow({ where: { id: input.workspaceId } }),
        ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } }),
      ]);

      const invite = await ctx.prisma.invite.upsert({
        where: { workspaceId_email: { workspaceId: input.workspaceId, email: input.email } },
        update: {
          role: input.role,
          status: "PENDING",
          expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
        },
        create: {
          workspaceId: input.workspaceId,
          email: input.email,
          role: input.role,
          invitedById: ctx.user.id,
          expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
        },
      });

      const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/invite/${invite.token}`;
      const emailResult = await sendEmail({
        to: input.email,
        subject: `${inviter.name} invited you to ${workspace.name} on ShipFlow AI`,
        html: inviteEmailHtml({ workspaceName: workspace.name, inviterName: inviter.name, acceptUrl }),
      });

      return { invite, acceptUrl, emailed: emailResult.sent };
    }),

  revoke: workspaceProcedure
    .use(requirePermission("members:invite"))
    .input(z.object({ workspaceId: z.string(), inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.prisma.invite.findUnique({ where: { id: input.inviteId } });
      if (!invite || invite.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found." });
      }
      await ctx.prisma.invite.update({ where: { id: input.inviteId }, data: { status: "REVOKED" } });
      return { success: true };
    }),

  /** Public so the invite landing page can show workspace name before login. */
  getByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ ctx, input }) => {
    const invite = await ctx.prisma.invite.findUnique({
      where: { token: input.token },
      include: { workspace: { select: { name: true, slug: true } } },
    });
    if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "This invite link isn't valid." });
    return {
      workspaceName: invite.workspace.name,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      isExpired: invite.expiresAt < new Date(),
    };
  }),

  accept: protectedProcedure.input(z.object({ token: z.string() })).mutation(async ({ ctx, input }) => {
    const invite = await ctx.prisma.invite.findUnique({ where: { token: input.token } });
    if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "This invite link isn't valid." });
    if (invite.status !== "PENDING") {
      // Not necessarily an error: if this is a double-submitted request (e.g.
      // a double-click) that lost the race to an identical concurrent one,
      // the invite is already ACCEPTED and the user is already a member —
      // send them on rather than showing an error for something that
      // actually succeeded.
      const workspace = await ctx.prisma.workspace.findUnique({ where: { id: invite.workspaceId } });
      const alreadyMember =
        workspace &&
        (await ctx.prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: ctx.user.id } },
        }));
      if (invite.status === "ACCEPTED" && alreadyMember && workspace) {
        return { workspaceSlug: workspace.slug };
      }
      throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has already been used or revoked." });
    }
    if (invite.expiresAt < new Date()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has expired. Ask for a new one." });
    }
    if (invite.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This invite was sent to ${invite.email} — sign in with that email to accept it.`,
      });
    }

    try {
      const [workspace] = await ctx.prisma.$transaction([
        ctx.prisma.workspace.findUniqueOrThrow({ where: { id: invite.workspaceId } }),
        ctx.prisma.workspaceMember.create({
          data: { workspaceId: invite.workspaceId, userId: ctx.user.id, role: invite.role },
        }),
        ctx.prisma.invite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } }),
      ]);
      return { workspaceSlug: workspace.slug };
    } catch (err) {
      // P2002 = unique constraint violation. The only one that can fire here
      // is workspace_members(workspaceId, userId) — meaning a concurrent
      // duplicate request already won this exact race. Same as above: that's
      // a success, not an error, from this user's point of view.
      if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
        const workspace = await ctx.prisma.workspace.findUniqueOrThrow({ where: { id: invite.workspaceId } });
        return { workspaceSlug: workspace.slug };
      }
      throw err;
    }
  }),
});
