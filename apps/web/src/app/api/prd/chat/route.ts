import { streamText } from "ai";
import { z } from "zod";
import { prisma } from "@shipflow/db";
import { getModel } from "@shipflow/api/lib/ai-provider";
import { getDecryptedKey } from "@shipflow/api/lib/api-keys";
import { getServerSession } from "@/lib/get-session";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a staff product manager helping someone turn a rough feature idea into a solid PRD.
Ask focused clarifying questions one or two at a time — about scope, edge cases, who it's for, and what
"done" looks like. Don't ask everything at once. Once you have enough to write a real PRD (usually after
3-5 exchanges), say so explicitly and suggest they click "Generate PRD". Keep responses conversational and
short — this is a chat, not a report.`;

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = z
    .object({
      workspaceId: z.string().min(1),
      prdId: z.string().min(1),
      message: z.string().trim().min(1).max(12_000),
    })
    .safeParse(await req.json().catch(() => null));
  if (!payload.success) return new Response("Invalid chat request.", { status: 400 });
  const { workspaceId, prdId, message } = payload.data;

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!membership) return new Response("Forbidden", { status: 403 });

  const prd = await prisma.prd.findUnique({
    where: { id: prdId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!prd || prd.workspaceId !== workspaceId) return new Response("Not found", { status: 404 });

  const apiKeyRow = await prisma.apiKey.findFirst({ where: { workspaceId } });
  if (!apiKeyRow) {
    return new Response("No AI provider key configured for this workspace.", { status: 412 });
  }

  await prisma.prdMessage.create({ data: { prdId, role: "user", content: message } });

  const apiKey = await getDecryptedKey(prisma, workspaceId, apiKeyRow.provider);
  const model = getModel(apiKeyRow.provider, apiKey);

  const history = [...prd.messages, { role: "user", content: message }].map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: history,
    onFinish: async ({ text }) => {
      await prisma.prdMessage.create({ data: { prdId, role: "assistant", content: text } });
    },
  });

  // Plain text stream — deliberately not the AI SDK's data-stream protocol,
  // so the client can consume it with a bare fetch + reader (see
  // components/discovery/chat.tsx) instead of taking on the client SDK's
  // exact version-specific wire format as a dependency.
  return result.toTextStreamResponse();
}


