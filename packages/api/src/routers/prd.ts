import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { createTRPCRouter, workspaceProcedure, requirePermission } from "../trpc";
import { getModel } from "../lib/ai-provider";
import { getDecryptedKey } from "../lib/api-keys";

const structuredPrdSchema = z.object({
  problem: z.string().describe("2-4 sentences describing the problem being solved and why it matters"),
  goals: z.array(z.string()).min(1).max(8).describe("Concrete, measurable goals"),
  userStories: z
    .array(z.object({ asA: z.string(), iWant: z.string(), soThat: z.string() }))
    .min(1)
    .max(10),
  edgeCases: z
    .array(z.string())
    .min(1)
    .max(12)
    .describe("Specific edge cases and failure modes an implementation must handle"),
});

export const prdRouter = createTRPCRouter({
  list: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.prd.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { tasks: true } }, author: { select: { name: true } } },
      });
    }),

  get: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), prdId: z.string() }))
    .query(async ({ ctx, input }) => {
      const prd = await ctx.prisma.prd.findUnique({
        where: { id: input.prdId },
        include: { messages: { orderBy: { createdAt: "asc" } }, author: { select: { name: true } } },
      });
      if (!prd || prd.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      }
      return prd;
    }),

  /** Kicks off discovery: creates the PRD row and the first chat message. */
  create: workspaceProcedure
    .use(requirePermission("prd:create"))
    .input(z.object({ workspaceId: z.string(), title: z.string().min(3).max(120), rawRequest: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.prisma.apiKey.findFirst({ where: { workspaceId: input.workspaceId } });
      if (!provider) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Add an OpenAI or Anthropic key in Settings → API Keys before starting discovery.",
        });
      }

      return ctx.prisma.prd.create({
        data: {
          workspaceId: input.workspaceId,
          authorId: ctx.user.id,
          title: input.title,
          rawRequest: input.rawRequest,
          status: "DRAFT",
          messages: { create: { role: "user", content: input.rawRequest } },
        },
      });
    }),

  /**
   * Turns the discovery conversation into a structured PRD. Uses the whole
   * message thread as context so the model has everything clarified so far,
   * not just the original one-line request.
   */
  generateStructured: workspaceProcedure
    .use(requirePermission("prd:edit"))
    .input(z.object({ workspaceId: z.string(), prdId: z.string(), provider: z.enum(["OPENAI", "ANTHROPIC"]) }))
    .mutation(async ({ ctx, input }) => {
      const prd = await ctx.prisma.prd.findUnique({
        where: { id: input.prdId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!prd || prd.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      }

      const apiKey = await getDecryptedKey(ctx.prisma, input.workspaceId, input.provider);
      const model = getModel(input.provider, apiKey);

      const transcript = prd.messages
        .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const { object } = await generateObject({
        model,
        schema: structuredPrdSchema,
        prompt: [
          "You are a staff product manager turning a raw feature request and clarifying conversation into a structured PRD.",
          "Be specific and concrete — no filler. Edge cases should be things an engineer could actually miss, not generic advice.",
          "",
          `Original request: ${prd.rawRequest}`,
          "",
          "Full conversation:",
          transcript,
        ].join("\n"),
      });

      return ctx.prisma.prd.update({
        where: { id: prd.id },
        data: { ...object, status: "READY" },
      });
    }),

  /** Manual edits after generation — the PRD is AI-drafted, not AI-owned. */
  update: workspaceProcedure
    .use(requirePermission("prd:edit"))
    .input(
      z.object({
        workspaceId: z.string(),
        prdId: z.string(),
        title: z.string().min(3).max(120).optional(),
        problem: z.string().optional(),
        goals: z.array(z.string()).optional(),
        userStories: z.array(z.object({ asA: z.string(), iWant: z.string(), soThat: z.string() })).optional(),
        edgeCases: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, prdId, ...rest } = input;
      const prd = await ctx.prisma.prd.findUnique({ where: { id: prdId } });
      if (!prd || prd.workspaceId !== workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      }
      return ctx.prisma.prd.update({ where: { id: prdId }, data: rest });
    }),

  archive: workspaceProcedure
    .use(requirePermission("prd:edit"))
    .input(z.object({ workspaceId: z.string(), prdId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prd = await ctx.prisma.prd.findUnique({ where: { id: input.prdId } });
      if (!prd || prd.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      }
      return ctx.prisma.prd.update({ where: { id: input.prdId }, data: { status: "ARCHIVED" } });
    }),
});


