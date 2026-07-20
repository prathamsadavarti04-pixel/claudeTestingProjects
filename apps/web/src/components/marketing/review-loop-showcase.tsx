import { Badge } from "@astryxdesign/core/Badge";
import { FileText, ListChecks, GitPullRequest, CheckCircle2 } from "lucide-react";

const STAGES = [
  { icon: FileText, label: "Discovery", detail: "Raw request → clarified → structured PRD" },
  { icon: ListChecks, label: "Planning", detail: "PRD → tasks on the board" },
  { icon: GitPullRequest, label: "Review", detail: "PR opens → AI checks it against the PRD" },
  { icon: CheckCircle2, label: "Shipped", detail: "Human approves → done" },
] as const;

export function ReviewLoopShowcase() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-background-surface)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-[56ch] text-center">
          <Badge label="The loop" variant="green" />
          <h2 className="mt-4 text-[28px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            The PRD doesn&apos;t stop mattering once the tickets are written
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--color-text-secondary)]">
            It's what every pull request gets checked against, automatically, for as long as the task stays
            open — not a document that goes stale the day planning ends.
          </p>
        </div>

        <div className="relative mt-14 grid gap-6 sm:grid-cols-4">
          {/* connecting line, desktop only */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-[var(--color-border)] sm:block"
          />
          {STAGES.map((s, i) => (
            <div key={s.label} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background-body)]">
                <s.icon className="h-5 w-5 text-[var(--color-icon-accent)]" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-[13px] font-medium text-[var(--color-text-secondary)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-0.5 text-[15px] font-semibold text-[var(--color-text-primary)]">{s.label}</p>
              <p className="mt-1 max-w-[20ch] text-[13px] leading-snug text-[var(--color-text-secondary)]">
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


