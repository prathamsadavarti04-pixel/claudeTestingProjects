import { Workflow } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-element)] bg-[var(--color-accent)] text-[var(--color-on-accent)]">
            <Workflow className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <span className="text-[13.5px] text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} ShipFlow AI
          </span>
        </div>
        <nav className="flex items-center gap-6 text-[13.5px] text-[var(--color-text-secondary)]">
          <a href="#product" className="hover:text-[var(--color-text-primary)]">Product</a>
          <a href="#how-it-works" className="hover:text-[var(--color-text-primary)]">How it works</a>
          <a href="#pricing" className="hover:text-[var(--color-text-primary)]">Pricing</a>
          <a href="/login" className="hover:text-[var(--color-text-primary)]">Sign in</a>
        </nav>
      </div>
    </footer>
  );
}
