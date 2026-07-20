import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateText } from "ai";
import { encryptSecret, lastFour } from "@shipflow/db/encryption";
import { createTRPCRouter, workspaceProcedure, requirePermission } from "../trpc";
import { getModel } from "../lib/ai-provider";
export { getDecryptedKey } from "../lib/api-keys";

const providerEnum = z.enum(["OPENAI", "ANTHROPIC"]);

export const apiKeyRouter = createTRPCRouter({
  /** Never returns the actual key — only enough to render "sk-...ab12". */
  list: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const keys = await ctx.prisma.apiKey.findMany({
        where: { workspaceId: input.workspaceId },
        select: {
          id: true,
          provider: true,
          label: true,
          keyLast4: true,
          lastUsedAt: true,
          lastVerifiedAt: true,
          createdAt: true,
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      return keys;
    }),

  /**
   * Validates the key against the real provider before saving anything —
   * so a typo'd key fails here, not silently during PRD generation later.
   */
  testConnection: workspaceProcedure
    .use(requirePermission("apiKeys:manage"))
    .input(z.object({ workspaceId: z.string(), provider: providerEnum, key: z.string().min(10) }))
    .mutation(async ({ input }) => {
      try {
        const model = getModel(input.provider, input.key);
        await generateText({ model, prompt: "Reply with exactly: OK", maxOutputTokens: 5 });
        return { valid: true as const };
      } catch (err) {
        return {
          valid: false as const,
          message: summarizeProviderError(err),
        };
      }
    }),

  upsert: workspaceProcedure
    .use(requirePermission("apiKeys:manage"))
    .input(
      z.object({
        workspaceId: z.string(),
        provider: providerEnum,
        label: z.string().min(1).max(60),
        key: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ciphertext, iv, authTag } = encryptSecret(input.key);

      const saved = await ctx.prisma.apiKey.upsert({
        where: { workspaceId_provider: { workspaceId: input.workspaceId, provider: input.provider } },
        update: {
          label: input.label,
          keyCiphertext: ciphertext,
          keyIv: iv,
          keyAuthTag: authTag,
          keyLast4: lastFour(input.key),
          lastVerifiedAt: new Date(),
        },
        create: {
          workspaceId: input.workspaceId,
          provider: input.provider,
          label: input.label,
          keyCiphertext: ciphertext,
          keyIv: iv,
          keyAuthTag: authTag,
          keyLast4: lastFour(input.key),
          createdById: ctx.user.id,
          lastVerifiedAt: new Date(),
        },
      });

      return { id: saved.id, provider: saved.provider, keyLast4: saved.keyLast4 };
    }),

  remove: workspaceProcedure
    .use(requirePermission("apiKeys:manage"))
    .input(z.object({ workspaceId: z.string(), keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = await ctx.prisma.apiKey.findUnique({ where: { id: input.keyId } });
      if (!key || key.workspaceId !== input.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Key not found." });
      }
      await ctx.prisma.apiKey.delete({ where: { id: input.keyId } });
      return { success: true };
    }),
});

function summarizeProviderError(err: unknown): string {
  if (err instanceof Error) {
    if (/401|invalid.*api.*key|incorrect.*api.*key/i.test(err.message)) {
      return "That key was rejected by the provider — double check it's correct and active.";
    }
    if (/429/.test(err.message)) {
      return "The provider rate-limited this request. The key itself may still be valid — try again shortly.";
    }
    return err.message.slice(0, 200);
  }
  return "Couldn't reach the provider to verify this key.";
}


