import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Badge } from "@astryxdesign/core/Badge";
import { GitPullRequest } from "lucide-react";
import type { RouterOutputs } from "@/lib/trpc/types";

type PullRequests = RouterOutputs["github"]["listPullRequests"];

function stateVariant(state: string): "neutral" | "orange" | "blue" | "green" {
  switch (state) {
    case "FIX_NEEDED":
      return "orange";
    case "AI_APPROVED":
      return "blue";
    case "SHIPPED":
      return "green";
    default:
      return "neutral";
  }
}

export function PullRequestList({ slug, pullRequests }: { slug: string; pullRequests: PullRequests }) {
  if (pullRequests.length === 0) {
    return (
      <EmptyState
        icon={<GitPullRequest className="h-7 w-7 text-[var(--color-icon-accent)]" />}
        title="No pull requests yet"
        description="Connect GitHub in Settings and open a PR on a linked task — it'll show up here with its AI review."
        actions={<a href={`/w/${slug}/settings/github`} className="text-[13.5px] text-[var(--color-text-accent)] hover:underline">Go to Settings → GitHub</a>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {pullRequests.map((pr: { id: string; repo: { fullName: string }; number: number; title: string; task: { title: string } | null; state: string }) => (
        <a
          key={pr.id}
          href={`/w/${slug}/pull-requests/${pr.id}`}
          className="flex items-center justify-between rounded-[var(--radius-element)] border border-[var(--color-border)] bg-[var(--color-background-surface)] px-4 py-3 hover:bg-[var(--color-background-muted)]"
        >
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-[var(--color-text-primary)]">
              {pr.repo.fullName}#{pr.number} — {pr.title}
            </p>
            <p className="text-[12.5px] text-[var(--color-text-secondary)]">
              {pr.task ? `Linked to ${pr.task.title}` : "No linked task"}
            </p>
          </div>
          <Badge label={pr.state.replace("_", " ")} variant={stateVariant(pr.state)} />
        </a>
      ))}
    </div>
  );
}


