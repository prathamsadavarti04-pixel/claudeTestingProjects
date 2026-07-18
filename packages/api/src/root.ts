import { createTRPCRouter } from "./trpc";
import { workspaceRouter } from "./routers/workspace";
import { memberRouter } from "./routers/member";
import { inviteRouter } from "./routers/invite";
import { apiKeyRouter } from "./routers/apiKey";
import { prdRouter } from "./routers/prd";
import { taskRouter } from "./routers/task";
import { githubRouter } from "./routers/github";
import { billingRouter } from "./routers/billing";

export const appRouter = createTRPCRouter({
  workspace: workspaceRouter,
  member: memberRouter,
  invite: inviteRouter,
  apiKey: apiKeyRouter,
  prd: prdRouter,
  task: taskRouter,
  github: githubRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
export { createTRPCContext } from "./trpc";
export type { AuthSession } from "./trpc";
