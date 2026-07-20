"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./task-card";
import type { Task } from "./board";

export function KanbanColumn({
  status,
  label,
  tasks,
}: {
  status: string;
  label: string;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)]">{label}</h3>
        <span className="text-[12px] text-[var(--color-text-disabled)]">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-col gap-2 rounded-[var(--radius-container)] p-2 transition-colors ${
          isOver ? "bg-[var(--color-accent-muted)]" : "bg-[var(--color-background-muted)]"
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-[var(--radius-element)] border border-dashed border-[var(--color-border)] px-3 py-6 text-center text-[12.5px] text-[var(--color-text-disabled)]">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}


