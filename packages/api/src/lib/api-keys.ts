import { TRPCError } from "@trpc/server";
import type { PrismaClient, AiProvider } from "@shipflow/db";
import { decryptSecret } from "@shipflow/db/encryption";

/**
 * Decrypts a workspace's stored key for a given provider. Used by the BYOK
 * test-connection/upsert flow, PRD structured-generation, and the Inngest
 * review loop — anywhere that needs to actually call out to OpenAI/Anthropic
 * on a workspace's behalf.
 */
export async function getDecryptedKey(
  prisma: PrismaClient,
  workspaceId: string,
  provider: AiProvider
): Promise<string> {
  const row = await prisma.apiKey.findUnique({
    where: { workspaceId_provider: { workspaceId, provider } },
  });
  if (!row) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `No ${provider} key configured for this workspace. Add one in Settings → API Keys.`,
    });
  }
  return decryptSecret({ ciphertext: row.keyCiphertext, iv: row.keyIv, authTag: row.keyAuthTag });
}
