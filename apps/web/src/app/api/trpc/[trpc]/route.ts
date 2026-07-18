import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@shipflow/api";
import { getServerSession } from "@/lib/get-session";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => createTRPCContext({ authSession: await getServerSession() }),
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`tRPC error on ${path ?? "<unknown>"}:`, error);
      }
    },
  });

export { handler as GET, handler as POST };
