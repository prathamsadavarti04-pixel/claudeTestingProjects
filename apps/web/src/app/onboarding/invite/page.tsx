"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/react";

type Row = { email: string; role: "ADMIN" | "DEVELOPER" | "REVIEWER" };

const ROLE_OPTIONS = [
  { value: "DEVELOPER", label: "Developer" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "ADMIN", label: "Admin" },
];

export default function InviteOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("ws") ?? "";
  const slug = searchParams.get("slug") ?? "";
  const [rows, setRows] = useState<Row[]>([{ email: "", role: "DEVELOPER" }]);
  const utils = trpc.useUtils();
  const invite = trpc.invite.create.useMutation();

  async function finish() {
    const valid = rows.filter((r) => r.email.includes("@"));
    await Promise.all(valid.map((r) => invite.mutateAsync({ workspaceId, email: r.email, role: r.role })));
    if (valid.length > 0) utils.invite.list.invalidate({ workspaceId });
    router.push(`/w/${slug}`);
  }

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
        Invite your team
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        Optional — you can always invite people later from Settings → Members.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <TextInput
                label="Email"
                isLabelHidden={i > 0}
                type="email"
                value={row.email}
                placeholder="teammate@company.com"
                onChange={(v) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, email: v } : x)))}
              />
            </div>
            <div className="w-[150px]">
              <Selector
                label="Role"
                isLabelHidden={i > 0}
                options={ROLE_OPTIONS}
                value={row.role}
                onChange={(v) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, role: v as Row["role"] } : x)))}
              />
            </div>
            <IconButton
              label="Remove row"
              icon={<Trash2 className="h-4 w-4" />}
              variant="ghost"
              isDisabled={rows.length === 1}
              onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
            />
          </div>
        ))}

        <div>
          <Button
            label="Add another"
            variant="ghost"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setRows((r) => [...r, { email: "", role: "DEVELOPER" }])}
          />
        </div>

        <div className="mt-3 grid">
          <Button label="Finish setup" variant="primary" size="lg" isLoading={invite.isPending} clickAction={finish} />
        </div>

        <button
          type="button"
          onClick={() => router.push(`/w/${slug}`)}
          className="text-center text-[13.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
        >
          Skip — I'll invite people later
        </button>
      </div>
    </div>
  );
}
