"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Badge } from "@astryxdesign/core/Badge";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import type { RouterOutputs } from "@/lib/trpc/types";

type Prd = RouterOutputs["prd"]["get"];
type UserStory = { asA: string; iWant: string; soThat: string };

export function PrdPreview({ prd, workspaceId }: { prd: Prd; workspaceId: string }) {
  const utils = trpc.useUtils();
  const [problem, setProblem] = useState(prd.problem ?? "");
  const [goals, setGoals] = useState<string[]>((prd.goals as string[]) ?? []);
  const [edgeCases, setEdgeCases] = useState<string[]>((prd.edgeCases as string[]) ?? []);
  const [userStories, setUserStories] = useState<UserStory[]>((prd.userStories as UserStory[]) ?? []);

  const update = trpc.prd.update.useMutation({
    onSuccess: () => utils.prd.get.invalidate({ workspaceId, prdId: prd.id }),
  });
  const generateTasks = trpc.task.generateFromPrd.useMutation({
    onSuccess: () => utils.task.list.invalidate({ workspaceId }),
  });

  function save() {
    update.mutate({ workspaceId, prdId: prd.id, problem, goals, edgeCases, userStories });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Badge label={prd.status} variant={prd.status === "READY" ? "green" : "neutral"} />
        {prd.status === "READY" && (
          <Button
            label={generateTasks.data ? `${generateTasks.data.created} tasks created` : "Generate tasks"}
            variant="secondary"
            size="sm"
            icon={<ListChecks className="h-3.5 w-3.5" />}
            isLoading={generateTasks.isPending}
            isDisabled={!!generateTasks.data}
            clickAction={async () => {
              await generateTasks.mutateAsync({ workspaceId, prdId: prd.id });
            }}
          />
        )}
      </div>

      <div>
        <TextArea label="Problem" value={problem} onChange={setProblem} rows={3} />
        <div className="mt-2 grid w-fit">
          <Button label="Save" variant="secondary" size="sm" isLoading={update.isPending} onClick={save} />
        </div>
      </div>

      <EditableList title="Goals" items={goals} onChange={(v) => { setGoals(v); save(); }} placeholder="A concrete, measurable goal" />

      <div>
        <p className="mb-2 text-[13px] font-medium text-[var(--color-text-secondary)]">User stories</p>
        <div className="flex flex-col gap-2">
          {userStories.map((s, i) => (
            <div key={i} className="rounded-[var(--radius-element)] border border-[var(--color-border)] p-3 text-[13.5px] text-[var(--color-text-primary)]">
              As a <strong>{s.asA}</strong>, I want <strong>{s.iWant}</strong>, so that {s.soThat}.
            </div>
          ))}
          {userStories.length === 0 && (
            <p className="text-[13px] text-[var(--color-text-secondary)]">None yet — generate the PRD from the chat first.</p>
          )}
        </div>
      </div>

      <EditableList
        title="Edge cases"
        items={edgeCases}
        onChange={(v) => { setEdgeCases(v); save(); }}
        placeholder="A specific failure mode an engineer could miss"
      />
    </div>
  );
}

function EditableList({
  title,
  items,
  onChange,
  placeholder,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-[var(--color-text-secondary)]">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              label={`${title} ${i + 1}`}
              isLabelHidden
              value={item}
              placeholder={placeholder}
              onChange={(v) => {
                const next = [...items];
                next[i] = v;
                onChange(next);
              }}
            />
            <IconButton
              label="Remove"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              variant="ghost"
              size="sm"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            />
          </div>
        ))}
        <div>
          <Button
            label="Add"
            variant="ghost"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => onChange([...items, ""])}
          />
        </div>
      </div>
    </div>
  );
}
