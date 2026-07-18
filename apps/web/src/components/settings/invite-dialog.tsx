"use client";

import { useState } from "react";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { useToast } from "@astryxdesign/core/Toast";
import { Copy } from "lucide-react";
import { trpc } from "@/lib/trpc/react";

const ROLE_OPTIONS = [
  { value: "DEVELOPER", label: "Developer" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "ADMIN", label: "Admin" },
];

export function InviteDialog({
  workspaceId,
  isOpen,
  onOpenChange,
}: {
  workspaceId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const [result, setResult] = useState<{ acceptUrl: string; emailed: boolean } | null>(null);
  const toast = useToast();
  const utils = trpc.useUtils();

  const createInvite = trpc.invite.create.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.invite.list.invalidate({ workspaceId });
    },
  });

  function close() {
    onOpenChange(false);
    setEmail("");
    setResult(null);
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={420}>
      <div className="p-5">
        <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Invite a teammate</h2>

        {!result ? (
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              createInvite.mutate({ workspaceId, email: email.trim(), role: role as "ADMIN" | "DEVELOPER" | "REVIEWER" });
            }}
          >
            <TextInput label="Email" type="email" value={email} onChange={setEmail} isRequired hasAutoFocus />
            <Selector label="Role" options={ROLE_OPTIONS} value={role} onChange={setRole} />
            {createInvite.isError && (
              <p className="text-[13px] text-[var(--color-text-red)]">{createInvite.error.message}</p>
            )}
            <div className="mt-1 flex justify-end gap-2">
              <Button label="Cancel" variant="ghost" onClick={close} />
              <Button label="Send invite" type="submit" variant="primary" isLoading={createInvite.isPending} />
            </div>
          </form>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {result.emailed ? (
              <Banner status="success" title="Invite sent" description={`We emailed ${email}.`} />
            ) : (
              <Banner
                status="info"
                title="Invite created"
                description="Email sending isn't configured — share this link with them directly."
              />
            )}
            <div className="flex items-center gap-2">
              <p className="flex-1 truncate rounded-[var(--radius-element)] border border-[var(--color-border)] bg-[var(--color-background-muted)] px-3 py-2 font-[family-name:var(--font-mono-code)] text-[12.5px] text-[var(--color-text-secondary)]">
                {result.acceptUrl}
              </p>
              <Button
                label="Copy"
                variant="secondary"
                icon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => {
                  navigator.clipboard.writeText(result.acceptUrl);
                  toast({ type: "info", body: "Copied" });
                }}
              />
            </div>
            <div className="mt-1 flex justify-end">
              <Button label="Done" variant="primary" onClick={close} />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
