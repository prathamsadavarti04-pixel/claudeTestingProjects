"use client";

import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { useToast } from "@astryxdesign/core/Toast";
import { Check } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import type { RouterOutputs } from "@/lib/trpc/types";

type Subscription = RouterOutputs["billing"]["getSubscription"];

export function BillingPanel({
  workspaceId,
  subscription,
  canManage,
}: {
  workspaceId: string;
  subscription: Subscription;
  canManage: boolean;
}) {
  const toast = useToast();
  const checkout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (result) => {
      if (!result.ready) {
        toast({ type: "info", body: `Billing not enabled yet — ${result.message}` });
      }
    },
  });

  const usagePercent = Math.min(100, Math.round((subscription.aiReviewsUsed / subscription.aiReviewsLimit) * 100));

  return (
    <div className="flex flex-col gap-6">
      <Card padding={4}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[var(--color-text-secondary)]">Current plan</p>
            <p className="text-[18px] font-semibold text-[var(--color-text-primary)]">
              {subscription.tier === "PRO" ? "Pro" : "Free"}
            </p>
          </div>
          <Badge label={subscription.tier} variant={subscription.tier === "PRO" ? "green" : "neutral"} />
        </div>
        <div className="mt-4">
          <ProgressBar
            label="AI reviews this period"
            value={subscription.aiReviewsUsed}
            max={subscription.aiReviewsLimit}
            hasValueLabel
            formatValueLabel={(value, max) => `${value} / ${max} AI reviews used`}
            variant={usagePercent >= 90 ? "warning" : "accent"}
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlanCard
          name="Free"
          price="$0"
          features={["25 AI reviews / month", "Unlimited PRDs & tasks", "Bring your own AI key", "1 GitHub App connection"]}
          isCurrent={subscription.tier === "FREE"}
        />
        <PlanCard
          name="Pro"
          price="$29/mo"
          features={["Unlimited AI reviews", "Unlimited PRDs & tasks", "Bring your own AI key", "Priority support"]}
          isCurrent={subscription.tier === "PRO"}
          action={
            canManage &&
            subscription.tier === "FREE" && (
              <Button
                label="Upgrade to Pro"
                variant="primary"
                isLoading={checkout.isPending}
                clickAction={async () => {
                  await checkout.mutateAsync({ workspaceId });
                }}
              />
            )
          }
        />
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  isCurrent,
  action,
}: {
  name: string;
  price: string;
  features: string[];
  isCurrent: boolean;
  action?: React.ReactNode;
}) {
  return (
    <Card padding={4} variant={isCurrent ? "green" : "default"}>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">{name}</p>
        {isCurrent && <Badge label="Current" variant="green" />}
      </div>
      <p className="mt-1 text-[22px] font-semibold text-[var(--color-text-primary)]">{price}</p>
      <ul className="mt-3 flex flex-col gap-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
            <Check className="h-3.5 w-3.5 text-[var(--color-icon-green)]" />
            {f}
          </li>
        ))}
      </ul>
      {action && <div className="mt-4 grid">{action}</div>}
    </Card>
  );
}


