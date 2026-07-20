import { GitBranch as Github } from "lucide-react";

export function IntegratesWith() {
  return (
    <div className="border-y border-[var(--color-border)] bg-[var(--color-background-surface)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-6 py-5 text-center">
        <Github className="h-4 w-4 text-[var(--color-icon-secondary)]" />
        <p className="text-[13.5px] text-[var(--color-text-secondary)]">
          Built for teams already shipping on <span className="text-[var(--color-text-primary)]">GitHub</span> —
          connects as a GitHub App, reviews land as normal PR comments.
        </p>
      </div>
    </div>
  );
}


