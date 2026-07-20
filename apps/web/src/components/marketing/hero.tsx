import { Button } from "@astryxdesign/core/Button";
import { KeyRound, GitBranch } from "lucide-react";
import { PrReviewPanel } from "./pr-review-panel";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.05fr_1fr] md:pb-28 md:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background-surface)] px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)]">
            <GitBranch className="h-3.5 w-3.5 text-[var(--color-icon-accent)]" />
            Discovery → tasks → PR review, one pipeline
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-[44px] leading-[1.08] tracking-tight text-[var(--color-text-primary)] sm:text-[56px]">
            Every pull request,
            <br />
            reviewed against the spec.
          </h1>

          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-[var(--color-text-secondary)]">
            ShipFlow turns a raw feature request into a structured PRD, breaks it into tasks, and has AI
            check every PR against that PRD the moment it opens — before a human ever has to.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button label="Start free" href="/signup" variant="primary" size="lg" />
            <Button
              label="See how it works"
              href="#how-it-works"
              variant="secondary"
              size="lg"
            />
          </div>

          <div className="mt-8 flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
            <KeyRound className="h-3.5 w-3.5" />
            Bring your own OpenAI or Anthropic key — no platform AI markup, ever.
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-x-8 -inset-y-6 -z-10 rounded-[40px] bg-[var(--color-accent-muted)] opacity-60 blur-2xl"
          />
          <PrReviewPanel className="mx-auto max-w-[480px] md:rotate-[0.6deg]" />
        </div>
      </div>
    </section>
  );
}


