import { createServerCaller } from "@/lib/trpc/server";
import { PullRequestList } from "@/components/pull-requests/list";

export default async function PullRequestsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });
  const pullRequests = await caller.github.listPullRequests({ workspaceId: workspace.id });

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-1 text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
        Pull requests
      </h1>
      <p className="mb-6 text-[13.5px] text-[var(--color-text-secondary)]">
        Every PR ShipFlow has seen, with its latest AI review verdict.
      </p>
      <PullRequestList slug={slug} pullRequests={pullRequests} />
    </div>
  );
}


