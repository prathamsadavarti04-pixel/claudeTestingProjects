import { createServerCaller } from "@/lib/trpc/server";
import { can } from "@shipflow/api/permissions";
import { MembersPanel } from "@/components/settings/members-panel";

export default async function MembersSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });
  const [members, invites] = await Promise.all([
    caller.member.list({ workspaceId: workspace.id }),
    caller.invite.list({ workspaceId: workspace.id }),
  ]);

  return (
    <MembersPanel
      workspaceId={workspace.id}
      slug={slug}
      initialMembers={members}
      initialInvites={invites}
      myRole={workspace.myRole}
      canManage={can(workspace.myRole, "members:invite")}
    />
  );
}
