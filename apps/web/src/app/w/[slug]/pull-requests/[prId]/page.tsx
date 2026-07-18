import { createServerCaller } from "@/lib/trpc/server";
import { can } from "@shipflow/api/permissions";
import { Badge } from "@astryxdesign/core/Badge";
import { ApprovalPanel } from "@/components/pull-requests/approval-panel";

const SEVERITY_VARIANT = { BLOCKING: "red", SUGGESTION: "orange", NIT: "neutral" } as const;

export default async function PullRequestDetailPage({
  params,
}: {
  params: Promise<{ slug: string; prId: string }>;
}) {
  const { slug, prId } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });
  const pr = await caller.github.getPullRequest({ workspaceId: workspace.id, pullRequestId: prId });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[var(--color-text-accent)] hover:underline">
            {pr.repo.fullName}#{pr.number} on GitHub ↗
          </a>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            {pr.title}
          </h1>
        </div>
        <Badge label={pr.state.replace("_", " ")} variant={pr.state === "SHIPPED" ? "green" : pr.state === "FIX_NEEDED" ? "orange" : "neutral"} />
      </div>

      <ApprovalPanel
        workspaceId={workspace.id}
        pullRequestId={pr.id}
        currentState={pr.state}
        canApprove={can(workspace.myRole, "pr:approve")}
      />

      <div className="mt-8">
        <h2 className="mb-3 text-[15px] font-semibold text-[var(--color-text-primary)]">Review history</h2>
        {pr.reviews.length === 0 && (
          <p className="text-[13.5px] text-[var(--color-text-secondary)]">No AI review has run yet.</p>
        )}
        <div className="flex flex-col gap-4">
          {pr.reviews.map(
            (review: {
              id: string;
              headSha: string;
              createdAt: string | Date;
              verdict: string;
              summary: string | null;
              comments: Array<{ id: string; severity: "BLOCKING" | "SUGGESTION" | "NIT"; filePath: string; line: number | null; body: string }>;
            }) => (
              <div key={review.id} className="rounded-[var(--radius-container)] border border-[var(--color-border)] bg-[var(--color-background-surface)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    {review.headSha.slice(0, 7)} · {new Date(review.createdAt).toLocaleString()}
                  </p>
                  <Badge
                    label={review.verdict.replace("_", " ")}
                    variant={review.verdict === "PASSED" ? "green" : review.verdict === "BLOCKING_ISSUES" ? "orange" : "neutral"}
                  />
                </div>
                {review.summary && (
                  <p className="mt-2 text-[13.5px] text-[var(--color-text-secondary)]">{review.summary}</p>
                )}
                {review.comments.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {review.comments.map((c) => (
                      <div key={c.id} className="rounded-[var(--radius-element)] bg-[var(--color-background-muted)] p-3">
                        <div className="flex items-center gap-2">
                          <Badge label={c.severity} variant={SEVERITY_VARIANT[c.severity]} />
                          <span className="font-[family-name:var(--font-mono-code)] text-[12px] text-[var(--color-text-secondary)]">
                            {c.filePath}
                            {c.line ? `:${c.line}` : ""}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] text-[var(--color-text-primary)]">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
