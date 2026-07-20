import { createServerCaller } from "@/lib/trpc/server";
import { DiscoveryDetailClient } from "@/components/discovery/detail-client";

export default async function PrdDetailPage({
  params,
}: {
  params: Promise<{ slug: string; prdId: string }>;
}) {
  const { slug, prdId } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });
  const prd = await caller.prd.get({ workspaceId: workspace.id, prdId });
  const apiKeys = await caller.apiKey.list({ workspaceId: workspace.id });

  return (
    <DiscoveryDetailClient
      workspaceId={workspace.id}
      prd={prd}
      defaultProvider={apiKeys[0]?.provider ?? "ANTHROPIC"}
    />
  );
}


