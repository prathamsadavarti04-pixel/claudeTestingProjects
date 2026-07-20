import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, workspaceProcedure, requirePermission } from "../trpc";

export const memberRouter = createTRPCRouter({
  list: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const members = await ctx.prisma.workspaceMember.findMany({
        where: { workspaceId: input.workspaceId },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "asc" },
      });
      return members;
    }),

  updateRole: workspaceProcedure
    .use(requirePermission("members:changeRole"))
    .input(
      z.object({
        workspaceId: z.string(),
        memberId: z.string(),
        role: z.enum(["ADMIN", "DEVELOPER", "REVIEWER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.prisma.workspaceMember.findUnique({ where: { id: input.memberId } });
      if (!member || member.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found in this workspace." });
      }

      if (member.role === "ADMIN" && input.role !== "ADMIN") {
        const adminCount = await ctx.prisma.workspaceMember.count({
          where: { workspaceId: input.workspaceId, role: "ADMIN" },
        });
        if (adminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A workspace needs at least one admin — promote someone else first.",
          });
        }
      }

      return ctx.prisma.workspaceMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
      });
    }),

  remove: workspaceProcedure
    .use(requirePermission("members:remove"))
    .input(z.object({ workspaceId: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.prisma.workspaceMember.findUnique({ where: { id: input.memberId } });
      if (!member || member.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found in this workspace." });
      }
      if (member.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't remove yourself. Ask another admin." });
      }

      await ctx.prisma.workspaceMember.delete({ where: { id: input.memberId } });
      return { success: true };
    }),
});


