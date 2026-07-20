import { createServerCaller } from "@/lib/trpc/server";
import { can } from "@shipflow/api/permissions";
import { GithubPanel } from "@/components/settings/github-panel";

export default async function GithubSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });
  const connection = await caller.github.getConnection({ workspaceId: workspace.id });

  return (
    <GithubPanel
      workspaceId={workspace.id}
      initialConnection={connection}
      canManage={can(workspace.myRole, "github:manage")}
    />
  );
}


