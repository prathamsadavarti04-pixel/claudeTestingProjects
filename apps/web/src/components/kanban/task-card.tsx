"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@astryxdesign/core/Card";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Badge } from "@astryxdesign/core/Badge";
import { GitPullRequest } from "lucide-react";
import type { Task } from "./board";

export function TaskCard({ task, isOverlay = false }: { task: Task; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card padding={3}>
        <p className="text-[13.5px] font-medium leading-snug text-[var(--color-text-primary)]">{task.title}</p>
        {task.prd && (
          <p className="mt-1 truncate text-[11.5px] text-[var(--color-text-secondary)]">from {task.prd.title}</p>
        )}
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {task.pullRequests.length > 0 && (
              <span className="flex items-center gap-1 text-[11.5px] text-[var(--color-text-secondary)]">
                <GitPullRequest className="h-3 w-3" />
                {task.pullRequests.length}
              </span>
            )}
            {task.pullRequests[0]?.state === "FIX_NEEDED" && <Badge label="Fix needed" variant="orange" />}
            {task.pullRequests[0]?.state === "AI_APPROVED" && <Badge label="AI approved" variant="green" />}
          </div>
          {task.assignee && <Avatar name={task.assignee.name} size="tiny" src={task.assignee.image ?? undefined} />}
        </div>
      </Card>
    </div>
  );
}


