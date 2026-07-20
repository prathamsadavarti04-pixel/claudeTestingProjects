"use client";
// hii
import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { trpc } from "@/lib/trpc/react";
import { KanbanColumn } from "./column";
import { TaskCard } from "./task-card";
import { NewTaskDialog } from "./new-task-dialog";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  order: number;
  assigneeId: string | null;
  assignee: { id: string; name: string; image: string | null } | null;
  prd: { id: string; title: string } | null;
  pullRequests: Array<{ id: string; number: number; state: string; url: string }>;
}

const COLUMNS = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "TODO", label: "To do" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "IN_REVIEW", label: "In review" },
  { status: "DONE", label: "Done" },
] as const;

export function KanbanBoard({ workspaceId, canEdit }: { workspaceId: string; canEdit: boolean }) {
  const utils = trpc.useUtils();
  const { data: tasks } = trpc.task.list.useQuery({ workspaceId }) as unknown as { data: Task[] | undefined };
  const moveTask = trpc.task.move.useMutation({
    onMutate: async (input) => {
      await utils.task.list.cancel({ workspaceId });
      const prev = utils.task.list.getData({ workspaceId });
      utils.task.list.setData({ workspaceId }, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map((t: Task) => (t.id === input.taskId ? { ...t, status: input.status } : t));
      });
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) utils.task.list.setData({ workspaceId }, ctx.prev);
    },
    onSettled: () => utils.task.list.invalidate({ workspaceId }),
  });

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const columns = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const c of COLUMNS) grouped[c.status] = [];
    for (const t of tasks ?? []) grouped[t.status]?.push(t);
    return grouped;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = (tasks ?? []).find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !canEdit) return;

    const activeTaskData = (tasks ?? []).find((t) => t.id === active.id);
    if (!activeTaskData) return;

    // `over.id` is either a column status (dropped on empty column area)
    // or another task's id (dropped near a specific card).
    const overIsColumn = COLUMNS.some((c) => c.status === over.id);
    const targetStatus = overIsColumn ? (over.id as unknown as Task["status"]) : (tasks ?? []).find((t) => t.id === over.id)?.status;
    if (!targetStatus) return;

    const beforeTaskId = overIsColumn ? null : (over.id as string);
    if (activeTaskData.status === targetStatus && activeTaskData.id === beforeTaskId) return;

    moveTask.mutate({ workspaceId, taskId: active.id as string, status: targetStatus, beforeTaskId });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13.5px] text-[var(--color-text-secondary)]">
          {(tasks ?? []).length} task{(tasks ?? []).length === 1 ? "" : "s"}
        </p>
        {canEdit && <NewTaskDialog workspaceId={workspaceId} />}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <SortableContext
              key={col.status}
              id={col.status}
              items={columns[col.status]?.map((t) => t.id) ?? []}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn status={col.status} label={col.label} tasks={columns[col.status] ?? []} />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>{activeTask && <TaskCard task={activeTask} isOverlay />}</DragOverlay>
      </DndContext>
    </div>
  );
}
