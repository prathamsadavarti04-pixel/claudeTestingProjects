import Link from "next/link";
import { Section } from "@astryxdesign/core/Section";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { FileText, GitPullRequest, Sparkles } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server";

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

export default async function WorkspaceDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });
  const [prds, tasks, pullRequests] = await Promise.all([
    caller.prd.list({ workspaceId: workspace.id }),
    caller.task.list({ workspaceId: workspace.id }),
    caller.github.listPullRequests({ workspaceId: workspace.id }),
  ]);

  const tasksByStatus: Record<string, number> = {};
  for (const t of tasks as unknown as Array<{ status: string }>) {
    tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1;
  }

  const isEmpty = prds.length === 0 && tasks.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
        {workspace.name}
      </h1>

      {isEmpty ? (
        <div className="mt-10">
          <EmptyState
            icon={<Sparkles className="h-8 w-8 text-[var(--color-icon-accent)]" />}
            title="Nothing here yet"
            description="Start by describing a feature you want to build — ShipFlow will turn it into a structured PRD."
            actions={<Button label="Start discovery" variant="primary" href={`/w/${slug}/discovery`} />}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Section>
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Task board</h2>
              <a href={`/w/${slug}/tasks`} className="text-[13px] text-[var(--color-text-accent)] hover:underline">
                View board
              </a>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
              {Object.entries(STATUS_LABEL).map(([status, label]) => (
                <div key={status} className="rounded-[var(--radius-element)] border border-[var(--color-border)] p-3">
                  <p className="text-[20px] font-semibold text-[var(--color-text-primary)]">
                    {tasksByStatus[status] ?? 0}
                  </p>
                  <p className="text-[12.5px] text-[var(--color-text-secondary)]">{label}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section>
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Recent PRDs</h2>
              <a
                href={`/w/${slug}/discovery`}
                className="text-[13px] text-[var(--color-text-accent)] hover:underline"
              >
                New
              </a>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {prds.length === 0 && (
                <p className="text-[13.5px] text-[var(--color-text-secondary)]">No PRDs yet.</p>
              )}
              {prds.slice(0, 4).map((prd: { id: string; title: string; status: string }) => (
                <Link
                  key={prd.id}
                  href={`/w/${slug}/discovery/${prd.id}`}
                  className="flex items-center justify-between rounded-[var(--radius-element)] border border-[var(--color-border)] px-3 py-2.5 hover:bg-[var(--color-background-muted)]"
                >
                  <span className="flex items-center gap-2 text-[13.5px] text-[var(--color-text-primary)]">
                    <FileText className="h-3.5 w-3.5 text-[var(--color-icon-secondary)]" />
                    {prd.title}
                  </span>
                  <Badge label={prd.status} variant={prd.status === "READY" ? "green" : "neutral"} />
                </Link>
              ))}
            </div>
          </Section>

          <Section className="md:col-span-2">
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Recent pull requests</h2>
              <a
                href={`/w/${slug}/pull-requests`}
                className="text-[13px] text-[var(--color-text-accent)] hover:underline"
              >
                View all
              </a>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {pullRequests.length === 0 && (
                <p className="text-[13.5px] text-[var(--color-text-secondary)]">
                  No pull requests yet — connect GitHub in Settings to start seeing AI reviews here.
                </p>
              )}
              {pullRequests.slice(0, 5).map((pr: { id: string; url: string; repo: { fullName: string }; number: number; title: string; state: string }) => (
                <a
                  key={pr.id}
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-[var(--radius-element)] border border-[var(--color-border)] px-3 py-2.5 hover:bg-[var(--color-background-muted)]"
                >
                  <span className="flex items-center gap-2 text-[13.5px] text-[var(--color-text-primary)]">
                    <GitPullRequest className="h-3.5 w-3.5 text-[var(--color-icon-secondary)]" />
                    {pr.repo.fullName}#{pr.number} — {pr.title}
                  </span>
                  <Badge label={pr.state.replace("_", " ")} variant={pr.state === "SHIPPED" ? "green" : "neutral"} />
                </a>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}


