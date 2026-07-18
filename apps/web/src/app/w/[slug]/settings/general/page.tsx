import { createServerCaller } from "@/lib/trpc/server";
import { can } from "@shipflow/api/permissions";
import { WorkspaceNameForm } from "@/components/settings/workspace-name-form";

export default async function GeneralSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });

  return (
    <div className="max-w-md">
      <WorkspaceNameForm
        workspaceId={workspace.id}
        initialName={workspace.name}
        canEdit={can(workspace.myRole, "workspace:update")}
      />
    </div>
  );
}
