import { Badge } from "@astryxdesign/core/Badge";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Avatar } from "@astryxdesign/core/Avatar";
import { GitPullRequest, MessageSquare } from "lucide-react";

/**
 * This is the one place on the page spending real visual boldness (see
 * frontend-design guidance: restraint everywhere else, one signature
 * moment). It's a fabricated-but-representative PR review — a diff, a
 * file tree sliver, and an AI comment that names an actual PRD edge case
 * — because showing the real mechanic beats an abstract illustration for
 * a product whose entire pitch is "specific, not generic."
 */
export function PrReviewPanel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-container)] border border-[var(--color-border)] bg-[var(--color-background-surface)] shadow-[0_20px_60px_-15px_rgba(20,30,15,0.35)] ${className}`}
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-background-muted)] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-emphasized)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-emphasized)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-emphasized)]" />
        </div>
        <div className="ml-2 flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)]">
          <GitPullRequest className="h-3.5 w-3.5" />
          <span className="font-[family-name:var(--font-mono-code)]">
            acme/billing-service · #482
          </span>
        </div>
      </div>

      {/* PR header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
            Add per-key rate limiting to the public API
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
            3 files changed · linked to task <span className="font-[family-name:var(--font-mono-code)]">RATE-114</span>
          </p>
        </div>
        <Badge label="Fix needed" variant="orange" />
      </div>

      {/* diff */}
      <div className="bg-[var(--color-background-body)] px-4 py-3 font-[family-name:var(--font-mono-code)] text-[12.5px] leading-relaxed">
        <p className="mb-1 text-[var(--color-text-secondary)]">middleware/rate-limit.ts</p>
        <div className="rounded-[var(--radius-element)] border border-[var(--color-border)] bg-[var(--color-background-surface)] overflow-hidden">
          <DiffLine type="ctx" text="  const key = req.headers['x-api-key'];" />
          <DiffLine type="add" text="+ const count = await redis.incr(bucketKey(key));" />
          <DiffLine type="add" text="+ if (count > getLimit(workspace.tier)) {" />
          <DiffLine type="add" text="+   return res.status(429).end();" />
          <DiffLine type="add" text="+ }" />
          <DiffLine type="ctx" text="  return next();" />
        </div>
      </div>

      {/* AI comment, grounded and specific */}
      <div className="flex gap-3 border-t border-[var(--color-border)] px-4 py-4">
        <Avatar name="ShipFlow AI" size="small" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--color-text-primary)]">ShipFlow AI</span>
            <StatusDot variant="warning" label="Reviewing" />
            <span className="text-[12px] text-[var(--color-text-secondary)]">reviewing against the PRD</span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-primary)]">
            <span className="font-medium text-[var(--color-text-orange)]">Blocking —</span>{" "}
            Edge case #3 in the PRD isn&apos;t handled: a key that hits the limit mid-burst can still let
            earlier, valid requests in the same window fail. This increments before checking, so a retried
            request could double-count.
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)]">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>2 more comments</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffLine({ type, text }: { type: "add" | "del" | "ctx"; text: string }) {
  const bg = type === "add" ? "bg-[#e7f0dc]" : type === "del" ? "bg-[#f5e3e0]" : "bg-transparent";
  const color =
    type === "add"
      ? "text-[#3e481d]"
      : type === "del"
        ? "text-[#8a3b2f]"
        : "text-[var(--color-text-secondary)]";
  return (
    <div className={`${bg} ${color} whitespace-pre px-3 py-[3px]`}>
      {text}
    </div>
  );
}


