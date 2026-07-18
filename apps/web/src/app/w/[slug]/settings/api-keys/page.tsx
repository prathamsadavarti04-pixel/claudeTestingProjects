import { createServerCaller } from "@/lib/trpc/server";
import { can } from "@shipflow/api/permissions";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";

export default async function ApiKeysSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });
  const keys = await caller.apiKey.list({ workspaceId: workspace.id });

  return (
    <ApiKeysPanel
      workspaceId={workspace.id}
      initialKeys={keys}
      canManage={can(workspace.myRole, "apiKeys:manage")}
    />
  );
}
