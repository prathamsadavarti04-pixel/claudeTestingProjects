"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc/react";

export function ApprovalPanel({
  workspaceId,
  pullRequestId,
  currentState,
  canApprove,
}: {
  workspaceId: string;
  pullRequestId: string;
  currentState: string;
  canApprove: boolean;
}) {
  const utils = trpc.useUtils();
  const approve = trpc.github.approvePullRequest.useMutation({
    onSuccess: () => utils.github.getPullRequest.invalidate({ workspaceId, pullRequestId }),
  });

  if (currentState === "SHIPPED") {
    return (
      <div className="mt-5">
        <Banner status="success" title="Shipped" description="A human reviewer approved this PR." />
      </div>
    );
  }

  if (!canApprove) {
    return (
      <div className="mt-5">
        <Banner
          status="info"
          title="Waiting on human approval"
          description="Only an Admin or Reviewer can mark this as shipped — that's by design, not a bug."
        />
      </div>
    );
  }

  return (
    <div className="mt-5">
      <Banner
        status={currentState === "FIX_NEEDED" ? "warning" : "info"}
        title={currentState === "FIX_NEEDED" ? "AI found blocking issues" : "Ready for your review"}
        description={
          currentState === "FIX_NEEDED"
            ? "You can still approve if the flagged issues are false positives or acceptable."
            : "AI review passed. Approve to mark this PR as shipped."
        }
        endContent={
          <Button
            label="Approve & mark shipped"
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            isLoading={approve.isPending}
            clickAction={() => approve.mutateAsync({ workspaceId, pullRequestId })}
          />
        }
      />
    </div>
  );
}
