import { verify } from "@octokit/webhooks-methods";

/**
 * Verifies the `X-Hub-Signature-256` header GitHub sends on every webhook
 * delivery. This MUST run before the payload body is trusted for anything —
 * without it, anyone who finds your webhook URL can POST a fake
 * "pull_request approved" event.
 *
 * `rawBody` has to be the exact bytes GitHub sent, not a re-serialized
 * JSON.stringify(parsed) — HMAC is computed over the literal request body,
 * so re-serializing (which can reorder keys or change whitespace) breaks
 * verification even for a genuine payload. Read it with request.text()
 * before any JSON.parse(), see app/api/webhooks/github/route.ts.
 */
export async function verifyGithubWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signatureHeader) return false;

  return verify(secret, rawBody, signatureHeader);
}

// Narrow slices of GitHub's webhook payloads — just the fields ShipFlow
// actually reads, not full @octokit/webhooks-types definitions.

export interface GithubPullRequestPayload {
  action: string;
  number: number;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    state: string;
    merged: boolean;
    head: { sha: string };
    base: { sha: string };
    user: { login: string };
  };
  repository: {
    name: string;
    full_name: string;
    owner: { login: string };
  };
  installation?: { id: number };
}

const PR_ACTIONS_THAT_TRIGGER_REVIEW = new Set(["opened", "reopened", "synchronize", "ready_for_review"]);

export function shouldTriggerReview(payload: GithubPullRequestPayload): boolean {
  if (payload.pull_request.state !== "open") return false;
  return PR_ACTIONS_THAT_TRIGGER_REVIEW.has(payload.action);
}


