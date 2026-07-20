import "server-only";
import { appRouter, createTRPCContext } from "@shipflow/api";
import { getServerSession } from "@/lib/get-session";

/** Call tRPC procedures directly from server components — no HTTP round trip. */
export async function createServerCaller() {
  const authSession = await getServerSession();
  const ctx = createTRPCContext({ authSession });
  return appRouter.createCaller(ctx);
}


