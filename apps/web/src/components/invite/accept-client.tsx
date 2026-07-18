"use client";

import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { trpc } from "@/lib/trpc/react";
import type { RouterOutputs } from "@/lib/trpc/types";

type Invite = RouterOutputs["invite"]["getByToken"];

export function AcceptInviteClient({
  token,
  invite,
  currentEmail,
}: {
  token: string;
  invite: Invite;
  currentEmail: string;
}) {
  const router = useRouter();
  const accept = trpc.invite.accept.useMutation({
    onSuccess: (result) => router.push(`/w/${result.workspaceSlug}`),
  });

  const emailMismatch = invite.email.toLowerCase() !== currentEmail.toLowerCase();

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-[380px] text-center">
        <h1 className="text-[20px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          Join {invite.workspaceName}
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
          You&apos;ve been invited as a {invite.role.toLowerCase()}.
        </p>

        <div className="mt-5">
          {invite.status !== "PENDING" ? (
            <Banner status="error" title="This invite is no longer valid" description="Ask for a new one." />
          ) : invite.isExpired ? (
            <Banner status="error" title="This invite has expired" description="Ask for a new one." />
          ) : emailMismatch ? (
            <Banner
              status="error"
              title="Wrong account"
              description={`This invite was sent to ${invite.email}. You're signed in as ${currentEmail}.`}
            />
          ) : (
            <div className="grid">
              <Button
                label="Accept invite"
                variant="primary"
                size="lg"
                isLoading={accept.isPending}
                clickAction={async () => {
                  await accept.mutateAsync({ token });
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
