import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, workspaceProcedure, requirePermission } from "../trpc";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "workspace"
  );
}

export const workspaceRouter = createTRPCRouter({
  /** Onboarding step 1. Creates the workspace and makes the creator ADMIN. */
  create: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const base = slugify(input.name);
      let slug = base;
      let attempt = 0;
      // Slugs must be unique; append a short suffix on collision rather than
      // erroring — the workspace name itself doesn't need to be unique.
      while (await ctx.prisma.workspace.findUnique({ where: { slug } })) {
        attempt += 1;
        slug = `${base}-${attempt + 1}`;
        if (attempt > 20) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't generate a unique slug." });
        }
      }

      const workspace = await ctx.prisma.workspace.create({
        data: {
          name: input.name,
          slug,
          members: { create: { userId: ctx.user.id, role: "ADMIN" } },
          subscription: { create: { tier: "FREE", aiReviewsLimit: 25 } },
        },
      });

      return workspace;
    }),

  /** Every workspace the signed-in user belongs to, for the workspace switcher. */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.workspaceMember.findMany({
      where: { userId: ctx.user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map(
      (m: { workspace: { id: string; name: string; slug: string }; role: "ADMIN" | "DEVELOPER" | "REVIEWER" }) => ({
        ...m.workspace,
        myRole: m.role,
      })
    );
  }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.prisma.workspace.findUnique({
        where: { slug: input.slug },
        include: {
          subscription: true,
          githubInstallation: { include: { repos: true } },
        },
      });
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });

      const membership = await ctx.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: ctx.user.id } },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "You're not a member of this workspace." });

      return { ...workspace, myRole: membership.role };
    }),

  update: workspaceProcedure
    .use(requirePermission("workspace:update"))
    .input(z.object({ workspaceId: z.string(), name: z.string().min(2).max(60) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.workspace.update({
        where: { id: input.workspaceId },
        data: { name: input.name },
      });
    }),
});
