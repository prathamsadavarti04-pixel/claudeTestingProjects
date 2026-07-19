"use client";

import { useState } from "react";
import { Table } from "@astryxdesign/core/Table";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Selector } from "@astryxdesign/core/Selector";
import { Badge } from "@astryxdesign/core/Badge";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Button } from "@astryxdesign/core/Button";
import { useToast } from "@astryxdesign/core/Toast";
import { UserMinus, UserPlus } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import type { RouterOutputs } from "@/lib/trpc/types";
import { InviteDialog } from "./invite-dialog";

type Member = RouterOutputs["member"]["list"][number];
type Invite = RouterOutputs["invite"]["list"][number];
type Role = "ADMIN" | "DEVELOPER" | "REVIEWER";

const ROLE_OPTIONS = [
  { value: "DEVELOPER", label: "Developer" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "ADMIN", label: "Admin" },
];

export function MembersPanel({
  workspaceId,
  slug,
  initialMembers,
  initialInvites,
  myRole,
  canManage,
}: {
  workspaceId: string;
  slug: string;
  initialMembers: Member[];
  initialInvites: Invite[];
  myRole: Role;
  canManage: boolean;
}) {
  const utils = trpc.useUtils();
  const toast = useToast();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: members } = trpc.member.list.useQuery({ workspaceId }, { initialData: initialMembers });
  const { data: invites } = trpc.invite.list.useQuery({ workspaceId }, { initialData: initialInvites });

  const updateRole = trpc.member.updateRole.useMutation({
    onSuccess: () => utils.member.list.invalidate({ workspaceId }),
    onError: (err) => toast({ type: "error", body: `Couldn't change role: ${err.message}` }),
  });
  const removeMember = trpc.member.remove.useMutation({
    onSuccess: () => {
      utils.member.list.invalidate({ workspaceId });
      toast({ type: "info", body: "Member removed" });
    },
    onError: (err) => toast({ type: "error", body: `Couldn't remove member: ${err.message}` }),
  });
  const revokeInvite = trpc.invite.revoke.useMutation({
    onSuccess: () => utils.invite.list.invalidate({ workspaceId }),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Members</h2>
          {canManage && (
            <Button
              label="Invite"
              variant="secondary"
              size="sm"
              icon={<UserPlus className="h-3.5 w-3.5" />}
              onClick={() => setIsInviteOpen(true)}
            />
          )}
        </div>

        <Table
          data={members ?? []}
          density="compact"
          dividers="rows"
          columns={[
            {
              key: "user",
              header: "Member",
              renderCell: (m: Member) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.user.name} src={m.user.image ?? undefined} size="small" />
                  <div>
                    <p className="text-[13.5px] text-[var(--color-text-primary)]">{m.user.name}</p>
                    <p className="text-[12px] text-[var(--color-text-secondary)]">{m.user.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "role",
              header: "Role",
              renderCell: (m: Member) =>
                canManage ? (
                  <div className="w-[150px]">
                    <Selector
                      label="Role"
                      isLabelHidden
                      options={ROLE_OPTIONS}
                      value={m.role}
                      onChange={(v) => updateRole.mutate({ workspaceId, memberId: m.id, role: v as unknown as Role })}
                    />
                  </div>
                ) : (
                  <Badge label={m.role} variant="neutral" />
                ),
            },
            {
              key: "actions",
              header: "",
              renderCell: (m: Member) =>
                canManage ? (
                  <IconButton
                    label="Remove member"
                    icon={<UserMinus className="h-3.5 w-3.5" />}
                    variant="ghost"
                    onClick={() => removeMember.mutate({ workspaceId, memberId: m.id })}
                  />
                ) : null,
            },
          ]}
        />
      </div>

      {canManage && invites && invites.length > 0 && (
        <div>
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--color-text-primary)]">Pending invites</h2>
          <div className="flex flex-col gap-2">
            {invites.map((inv: { id: string; email: string; role: string }) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-[var(--radius-element)] border border-[var(--color-border)] px-3 py-2.5"
              >
                <div>
                  <p className="text-[13.5px] text-[var(--color-text-primary)]">{inv.email}</p>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">Invited as {inv.role.toLowerCase()}</p>
                </div>
                <Button
                  label="Revoke"
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeInvite.mutate({ workspaceId, inviteId: inv.id })}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <InviteDialog workspaceId={workspaceId} isOpen={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </div>
  );
}
