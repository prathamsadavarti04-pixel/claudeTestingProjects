import { createServerCaller } from "@/lib/trpc/server";
import { can } from "@shipflow/api/permissions";
import { KanbanBoard } from "@/components/kanban/board";

export default async function TasksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const workspace = await caller.workspace.getBySlug({ slug });

  return (
    <div className="px-6 py-8">
      <h1 className="mb-1 text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">Tasks</h1>
      <p className="mb-6 text-[13.5px] text-[var(--color-text-secondary)]">
        Drag cards between columns. Tasks generated from a PRD keep a link back to it.
      </p>
      <KanbanBoard workspaceId={workspace.id} canEdit={can(workspace.myRole, "task:edit")} />
    </div>
  );
}
