import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server";
import { NewPrdForm } from "@/components/discovery/new-prd-form";
import { Badge } from "@astryxdesign/core/Badge";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { FileText } from "lucide-react";

export default async function DiscoveryListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });
  const [prds, apiKeys] = await Promise.all([
    caller.prd.list({ workspaceId: workspace.id }),
    caller.apiKey.list({ workspaceId: workspace.id }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">Discovery</h1>
      <p className="mt-1 text-[13.5px] text-[var(--color-text-secondary)]">
        Describe a feature request. ShipFlow asks clarifying questions, then drafts a structured PRD.
      </p>

      <div className="mt-6">
        <NewPrdForm workspaceId={workspace.id} slug={slug} hasApiKey={apiKeys.length > 0} />
      </div>

      <div className="mt-10">
        {prds.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-7 w-7 text-[var(--color-icon-accent)]" />}
            title="No PRDs yet"
            description="Start one above — it'll show up here."
            isCompact
          />
        ) : (
          <div className="flex flex-col gap-2">
            {prds.map((prd: { id: string; title: string; status: string; author: { name: string }; _count: { tasks: number } }) => (
              <Link
                key={prd.id}
                href={`/w/${slug}/discovery/${prd.id}`}
                className="flex items-center justify-between rounded-[var(--radius-element)] border border-[var(--color-border)] bg-[var(--color-background-surface)] px-4 py-3 hover:bg-[var(--color-background-muted)]"
              >
                <div>
                  <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{prd.title}</p>
                  <p className="text-[12.5px] text-[var(--color-text-secondary)]">
                    {prd._count.tasks} task{prd._count.tasks === 1 ? "" : "s"} · by {prd.author.name}
                  </p>
                </div>
                <Badge label={prd.status} variant={prd.status === "READY" ? "green" : "neutral"} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
