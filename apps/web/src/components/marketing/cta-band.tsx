import { Button } from "@astryxdesign/core/Button";

export function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="rounded-[var(--radius-container)] bg-[var(--color-accent)] px-8 py-14 text-center sm:px-16">
        <h2 className="font-[family-name:var(--font-display)] text-[30px] leading-tight text-[var(--color-on-accent)] sm:text-[38px]">
          Start free. Bring your own key.
        </h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-[15.5px] leading-relaxed text-[var(--color-on-accent)] opacity-85">
          No credit card, no seat minimums, no platform markup on AI calls. Just your workspace, your GitHub
          repos, and your own OpenAI or Anthropic key.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button label="Create your workspace" href="/signup" variant="secondary" size="lg" />
        </div>
      </div>
    </section>
  );
}
