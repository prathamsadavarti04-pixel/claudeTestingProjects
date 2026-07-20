import { createServerCaller } from "@/lib/trpc/server";
import { can } from "@shipflow/api/permissions";
import { BillingPanel } from "@/components/settings/billing-panel";

export default async function BillingSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });
  const subscription = await caller.billing.getSubscription({ workspaceId: workspace.id });

  return (
    <BillingPanel
      workspaceId={workspace.id}
      subscription={subscription}
      canManage={can(workspace.myRole, "billing:manage")}
    />
  );
}


