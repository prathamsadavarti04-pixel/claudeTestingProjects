import { prisma } from "@shipflow/db";
import { verifyGithubWebhookSignature, shouldTriggerReview, type GithubPullRequestPayload } from "@shipflow/github/webhook";
import { inngest } from "@shipflow/inngest";

/**
 * Signature verification happens BEFORE the body is parsed as JSON, on the
 * exact raw bytes GitHub sent — see the comment in packages/github/src/webhook.ts
 * for why that ordering matters.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  const isValid = await verifyGithubWebhookSignature(rawBody, signature);
  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  if (event !== "pull_request") {
    // We only act on pull_request events; anything else (issues, pushes,
    // installation events) is acknowledged but ignored.
    return new Response("ok", { status: 200 });
  }

  const payload = JSON.parse(rawBody) as GithubPullRequestPayload;
  if (!shouldTriggerReview(payload)) {
    return new Response("ok", { status: 200 });
  }

  const repo = await prisma.githubRepo.findUnique({
    where: { fullName: payload.repository.full_name },
    include: { installation: true },
  });

  if (!repo || !repo.isActive) {
    return new Response("ok", { status: 200 }); // repo not connected, or reviews turned off for it
  }

  const pr = await prisma.pullRequest.upsert({
    where: { repoId_number: { repoId: repo.id, number: payload.pull_request.number } },
    update: {
      title: payload.pull_request.title,
      headSha: payload.pull_request.head.sha,
      state: "OPEN",
    },
    create: {
      workspaceId: repo.installation.workspaceId,
      repoId: repo.id,
      number: payload.pull_request.number,
      title: payload.pull_request.title,
      authorLogin: payload.pull_request.user.login,
      headSha: payload.pull_request.head.sha,
      baseSha: payload.pull_request.base.sha,
      url: payload.pull_request.html_url,
      state: "OPEN",
    },
  });

  await inngest.send({ name: "github/pull_request.received", data: { pullRequestId: pr.id } });

  return new Response("ok", { status: 200 });
}
