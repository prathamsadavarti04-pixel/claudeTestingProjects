"use client";

import { useState } from "react";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc/react";

export function NewTaskDialog({ workspaceId }: { workspaceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const utils = trpc.useUtils();

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate({ workspaceId });
      setTitle("");
      setDescription("");
      setIsOpen(false);
    },
  });

  return (
    <>
      <Button label="New task" icon={<Plus className="h-4 w-4" />} variant="secondary" onClick={() => setIsOpen(true)} />
      <Dialog isOpen={isOpen} onOpenChange={setIsOpen} purpose="form" width={440}>
        <div className="p-5">
          <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">New task</h2>
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim()) createTask.mutate({ workspaceId, title: title.trim(), description: description.trim() || undefined });
            }}
          >
            <TextInput label="Title" value={title} onChange={setTitle} isRequired hasAutoFocus />
            <TextArea label="Description" value={description} onChange={setDescription} isOptional />
            <div className="mt-1 flex justify-end gap-2">
              <Button label="Cancel" variant="ghost" onClick={() => setIsOpen(false)} />
              <Button
                label="Create task"
                type="submit"
                variant="primary"
                isLoading={createTask.isPending}
                isDisabled={!title.trim()}
              />
            </div>
          </form>
        </div>
      </Dialog>
    </>
  );
}
