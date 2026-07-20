import { z } from "zod";
import { generateObject } from "ai";
import { prisma } from "@shipflow/db";
import { getModel } from "@shipflow/api/lib/ai-provider";
import { getDecryptedKey } from "@shipflow/api/lib/api-keys";
import {
  fetchPullRequestDiff,
  postPullRequestComment,
  type PrDiffFile,
} from "@shipflow/github";
import { chunkDiff, exceedsHardLimit, formatDiffChunkForPrompt, totalDiffLines } from "@shipflow/github/diff";
import { inngest } from "../client";

const chunkReviewSchema = z.object({
  verdict: z.enum(["passed", "blocking_issues"]),
  comments: z.array(
    z.object({
      filePath: z.string(),
      line: z.number().nullable(),
      severity: z.enum(["BLOCKING", "SUGGESTION", "NIT"]),
      body: z.string(),
    })
  ),
});

/** Minimal shape for the one step tool this function uses. */
interface InngestStepTools {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<T>;
}

export const reviewPullRequest = inngest.createFunction(
  {
    id: "review-pull-request",
    // Each step retries independently; this caps retries for the whole
    // function so a permanently-broken PR doesn't loop forever.
    retries: 3,
    concurrency: { limit: 5 }, // don't hammer one provider's rate limit across many PRs at once
    triggers: [{ event: "github/pull_request.received" }],
  },
  async ({ event, step }: { event: { data: { pullRequestId: string } }; step: InngestStepTools }) => {
    const { pullRequestId } = event.data;

    const context = await step.run("load-context", async () => {
      const pr = await prisma.pullRequest.findUniqueOrThrow({
        where: { id: pullRequestId },
        include: {
          repo: { include: { installation: true } },
          task: { include: { prd: true } },
          workspace: { include: { subscription: true, apiKeys: true } },
        },
      });
      return pr;
    });

    // Guard: no PRD linked to this PR's task means there's nothing to review against.
    const prd = context.task?.prd;
    if (!prd || prd.status !== "READY") {
      await step.run("skip-no-prd", async () => {
        await prisma.reviewRun.create({
          data: {
            pullRequestId,
            headSha: context.headSha,
            verdict: "SKIPPED_TOO_LARGE", // reusing as "skipped" bucket; see summary field for why
            summary: "No linked PRD is ready yet — link this PR's task to a completed PRD to enable AI review.",
            completedAt: new Date(),
          },
        });
      });
      return { skipped: "no-prd" };
    }

    // Guard: plan limit.
    const subscription = context.workspace.subscription;
    if (subscription && subscription.aiReviewsUsed >= subscription.aiReviewsLimit) {
      await step.run("skip-over-limit", async () => {
        await prisma.reviewRun.create({
          data: {
            pullRequestId,
            headSha: context.headSha,
            verdict: "ERROR",
            summary: `Workspace has used ${subscription.aiReviewsUsed}/${subscription.aiReviewsLimit} AI reviews this period. Upgrade in Settings → Billing to continue.`,
            completedAt: new Date(),
          },
        });
      });
      return { skipped: "over-limit" };
    }

    const apiKeyRow = context.workspace.apiKeys[0];
    if (!apiKeyRow) {
      await step.run("skip-no-key", async () => {
        await prisma.reviewRun.create({
          data: {
            pullRequestId,
            headSha: context.headSha,
            verdict: "ERROR",
            summary: "No AI provider key configured for this workspace (Settings → API Keys).",
            completedAt: new Date(),
          },
        });
      });
      return { skipped: "no-api-key" };
    }

    const diffFiles: PrDiffFile[] = await step.run("fetch-diff", async () => {
      return fetchPullRequestDiff(
        context.repo.installation.installationId,
        context.repo.owner,
        context.repo.name,
        context.number
      );
    });

    if (exceedsHardLimit(diffFiles)) {
      await step.run("skip-too-large", async () => {
        const lines = totalDiffLines(diffFiles);
        await prisma.reviewRun.create({
          data: {
            pullRequestId,
            headSha: context.headSha,
            verdict: "SKIPPED_TOO_LARGE",
            summary: `This PR changes ${lines.toLocaleString()} lines, above the automatic review limit. Please have a human review it, or split it into smaller PRs.`,
            diffLineCount: lines,
            completedAt: new Date(),
          },
        });
        await postPullRequestComment(
          context.repo.installation.installationId,
          context.repo.owner,
          context.repo.name,
          context.number,
          `**ShipFlow AI** — this PR is too large to review automatically (${lines.toLocaleString()} lines changed). Please request a human review, or split this into smaller PRs.`
        );
      });
      return { skipped: "too-large" };
    }

    const reviewRunId = await step.run("create-review-run", async () => {
      const run = await prisma.reviewRun.create({
        data: {
          pullRequestId,
          headSha: context.headSha,
          verdict: "RUNNING",
          diffLineCount: totalDiffLines(diffFiles),
          provider: apiKeyRow.provider,
        },
      });
      return run.id;
    });

    const chunks = chunkDiff(diffFiles);
    const prdContext = [
      `# PRD: ${prd.title}`,
      `## Problem\n${prd.problem ?? ""}`,
      `## Goals\n${((prd.goals as unknown as string[]) ?? []).map((g) => `- ${g}`).join("\n")}`,
      `## Edge cases the implementation must handle\n${((prd.edgeCases as unknown as string[]) ?? []).map((e) => `- ${e}`).join("\n")}`,
    ].join("\n\n");

    // Each chunk is its own step — Inngest retries a failed step (e.g. a
    // provider 429) independently without re-running chunks that already
    // succeeded.
    const chunkResults = await Promise.all(
      chunks.map((chunk, i) =>
        step.run(`review-chunk-${i}`, async () => {
          const apiKey = await getDecryptedKey(prisma, context.workspaceId, apiKeyRow.provider);
          const model = getModel(apiKeyRow.provider, apiKey);

          const { object } = await generateObject({
            model,
            schema: chunkReviewSchema,
            prompt: [
              "You are reviewing a GitHub pull request diff against its PRD. Be specific and reference the PRD by name when flagging an issue.",
              "Mark `severity: BLOCKING` only for things that genuinely contradict a stated goal or unhandled edge case from the PRD — not style preferences.",
              "Use SUGGESTION for real improvements that aren't blocking, and NIT for minor polish. It's fine to return zero comments if the diff looks correct.",
              "",
              prdContext,
              "",
              `# Diff (part ${i + 1} of ${chunks.length})`,
              formatDiffChunkForPrompt(chunk),
            ].join("\n"),
          });

          return object;
        })
      )
    );

    const result = await step.run("aggregate-and-post", async () => {
      const allComments = chunkResults.flatMap((r) => r.comments);
      const hasBlocking = chunkResults.some((r) => r.verdict === "blocking_issues");
      const verdict = hasBlocking ? "BLOCKING_ISSUES" : "PASSED";

      await prisma.reviewComment.createMany({
        data: allComments.map((c) => ({
          reviewRunId,
          filePath: c.filePath,
          line: c.line,
          severity: c.severity,
          body: c.body,
        })),
      });

      const blockingComments = allComments.filter((c) => c.severity === "BLOCKING");
      const summary = hasBlocking
        ? `Found ${blockingComments.length} blocking issue${blockingComments.length === 1 ? "" : "s"} against the PRD.`
        : "No blocking issues found against the PRD.";

      await prisma.reviewRun.update({
        where: { id: reviewRunId },
        data: { verdict, summary, chunkCount: chunks.length, completedAt: new Date() },
      });

      await prisma.pullRequest.update({
        where: { id: pullRequestId },
        data: { state: hasBlocking ? "FIX_NEEDED" : "AI_APPROVED" },
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { workspaceId: context.workspaceId },
          data: { aiReviewsUsed: { increment: 1 } },
        });
      }

      const commentBody = formatGithubComment(summary, allComments, hasBlocking);
      await postPullRequestComment(
        context.repo.installation.installationId,
        context.repo.owner,
        context.repo.name,
        context.number,
        commentBody
      );
      await prisma.reviewComment.updateMany({ where: { reviewRunId }, data: { postedToGithub: true } });

      return { verdict, commentCount: allComments.length };
    });

    return result;
  }
);

function formatGithubComment(
  summary: string,
  comments: Array<{ filePath: string; line: number | null; severity: string; body: string }>,
  hasBlocking: boolean
): string {
  const header = hasBlocking ? "🚧 **ShipFlow AI — changes needed**" : "✅ **ShipFlow AI — looks good**";
  const bySeverity = (sev: string) => comments.filter((c) => c.severity === sev);

  const section = (title: string, items: typeof comments) =>
    items.length === 0
      ? ""
      : `\n**${title}**\n${items.map((c) => `- \`${c.filePath}${c.line ? `:${c.line}` : ""}\` — ${c.body}`).join("\n")}\n`;

  return [
    header,
    "",
    summary,
    section("Blocking", bySeverity("BLOCKING")),
    section("Suggestions", bySeverity("SUGGESTION")),
    section("Nits", bySeverity("NIT")),
    "",
    "_Reviewed against the linked PRD. A human still has final approval — see the task in ShipFlow._",
  ]
    .filter(Boolean)
    .join("\n");
}


