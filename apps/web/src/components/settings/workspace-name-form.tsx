"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { trpc } from "@/lib/trpc/react";

export function WorkspaceNameForm({
  workspaceId,
  initialName,
  canEdit,
}: {
  workspaceId: string;
  initialName: string;
  canEdit: boolean;
}) {
  const [name, setName] = useState(initialName);
  const toast = useToast();
  const update = trpc.workspace.update.useMutation({
    onSuccess: () => toast({ type: "info", body: "Workspace updated" }),
    onError: (err) => toast({ type: "error", body: `Couldn't save: ${err.message}` }),
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate({ workspaceId, name: name.trim() });
      }}
    >
      <TextInput
        label="Workspace name"
        value={name}
        onChange={setName}
        isDisabled={!canEdit}
        description={!canEdit ? "Only admins can rename the workspace." : undefined}
      />
      {canEdit && (
        <div className="grid w-fit">
          <Button
            label="Save"
            type="submit"
            variant="primary"
            isLoading={update.isPending}
            isDisabled={name.trim() === initialName || name.trim().length < 2}
          />
        </div>
      )}
    </form>
  );
}
