import { Inngest } from "inngest";

/**
 * Not using Inngest's newer typed-event (EventType/StandardSchema) system
 * here — it's a bigger API surface than this one background job needs.
 * The single event this app sends/receives is typed manually at the two
 * call sites instead (this file's JSDoc, and functions/review-pr.ts).
 */
export const inngest = new Inngest({ id: "shipflow-ai" });

/** Sent by the GitHub webhook route once signature verification passes. */
export interface PullRequestReceivedEvent {
  name: "github/pull_request.received";
  data: { pullRequestId: string };
}
