import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { createServerCaller } from "@/lib/trpc/server";
import { AcceptInviteClient } from "@/components/invite/accept-client";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const caller = await createServerCaller();

  let invite;
  try {
    invite = await caller.invite.getByToken({ token });
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-[15px] text-[var(--color-text-secondary)]">This invite link isn&apos;t valid.</p>
      </div>
    );
  }

  const session = await getServerSession();
  if (!session?.user) {
    redirect(`/signup?next=/invite/${token}`);
  }

  return <AcceptInviteClient token={token} invite={invite} currentEmail={session.user.email} />;
}
