"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { trpc } from "@/lib/trpc/react";

export default function WorkspaceOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: (workspace) => {
      router.push(`/onboarding/api-key?ws=${workspace.id}&slug=${workspace.slug}`);
    },
  });

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
        Name your workspace
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        This is where your team's PRDs, tasks, and PR reviews will live. You can rename it later.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length >= 2) createWorkspace.mutate({ name: name.trim() });
        }}
      >
        <TextInput
          label="Workspace name"
          value={name}
          onChange={setName}
          placeholder="Acme Engineering"
          isRequired
          hasAutoFocus
          status={
            createWorkspace.isError ? { type: "error", message: createWorkspace.error.message } : undefined
          }
        />
        <div className="grid">
          <Button
            label="Continue"
            type="submit"
            variant="primary"
            size="lg"
            isLoading={createWorkspace.isPending}
            isDisabled={name.trim().length < 2}
          />
        </div>
      </form>
    </div>
  );
}


