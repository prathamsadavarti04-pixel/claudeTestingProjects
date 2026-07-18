import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, workspaceProcedure, requirePermission } from "../trpc";

export const githubRouter = createTRPCRouter({
  getConnection: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const installation = await ctx.prisma.githubInstallation.findUnique({
        where: { workspaceId: input.workspaceId },
        include: { repos: true },
      });

      return {
        connected: !!installation,
        accountLogin: installation?.accountLogin ?? null,
        appConfigured: !!process.env.GITHUB_APP_ID && !!process.env.GITHUB_APP_PRIVATE_KEY,
        appSlug: process.env.GITHUB_APP_SLUG ?? null,
        repos: installation?.repos ?? [],
      };
    }),

  toggleRepo: workspaceProcedure
    .use(requirePermission("github:manage"))
    .input(z.object({ workspaceId: z.string(), repoId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const repo = await ctx.prisma.githubRepo.findUnique({
        where: { id: input.repoId },
        include: { installation: true },
      });
      if (!repo || repo.installation.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found." });
      }
      return ctx.prisma.githubRepo.update({ where: { id: input.repoId }, data: { isActive: input.isActive } });
    }),

  disconnect: workspaceProcedure
    .use(requirePermission("github:manage"))
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.githubInstallation.deleteMany({ where: { workspaceId: input.workspaceId } });
      return { success: true };
    }),

  listPullRequests: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.pullRequest.findMany({
        where: { workspaceId: input.workspaceId },
        include: {
          repo: { select: { fullName: true } },
          task: { select: { id: true, title: true } },
          reviews: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });
    }),

  getPullRequest: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), pullRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const pr = await ctx.prisma.pullRequest.findUnique({
        where: { id: input.pullRequestId },
        include: {
          repo: true,
          task: true,
          reviews: {
            orderBy: { createdAt: "desc" },
            include: { comments: { orderBy: { createdAt: "asc" } } },
          },
        },
      });
      if (!pr || pr.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pull request not found." });
      }
      return pr;
    }),

  /** The human-approval gate. ADMIN or REVIEWER only — enforced below, not just in the UI. */
  approvePullRequest: workspaceProcedure
    .use(requirePermission("pr:approve"))
    .input(z.object({ workspaceId: z.string(), pullRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pr = await ctx.prisma.pullRequest.findUnique({ where: { id: input.pullRequestId } });
      if (!pr || pr.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pull request not found." });
      }
      return ctx.prisma.pullRequest.update({
        where: { id: input.pullRequestId },
        data: { state: "SHIPPED", shippedAt: new Date(), shippedById: ctx.user.id },
      });
    }),
});
