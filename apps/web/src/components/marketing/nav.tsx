import { Button } from "@astryxdesign/core/Button";
import { Workflow } from "lucide-react";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background-body)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-element)] bg-[var(--color-accent)] text-[var(--color-on-accent)]">
            <Workflow className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            ShipFlow AI
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {[
            ["How it works", "#how-it-works"],
            ["Product", "#product"],
            ["Pricing", "#pricing"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[14px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button label="Sign in" href="/login" variant="ghost" size="sm" />
          <Button label="Start free" href="/signup" variant="primary" size="sm" />
        </div>
      </div>
    </header>
  );
}


