const STEPS = [
  {
    n: "01",
    title: "Create a workspace, connect GitHub",
    body: "Two minutes: name your workspace, install the ShipFlow GitHub App on the repos you want reviewed.",
    code: "$ shipflow.dev/onboarding",
  },
  {
    n: "02",
    title: "Add your AI provider key",
    body: "Paste an OpenAI or Anthropic key. It's encrypted at rest and only ever decrypted server-side to make the call you asked for.",
    code: "sk-••••••••••••ab12",
  },
  {
    n: "03",
    title: "Open a PR like you always do",
    body: "ShipFlow picks it up automatically, reviews it against the linked PRD, and comments — no new workflow to learn.",
    code: "gh pr create",
  },
] as const;

export function StartShipping() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-[52ch]">
        <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--color-text-accent)]">
          Getting started
        </p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          From nothing to your first AI review
        </h2>
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n}>
            <p className="font-[family-name:var(--font-display)] text-[34px] text-[var(--color-accent-muted)]">
              {s.n}
            </p>
            <h3 className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">{s.title}</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{s.body}</p>
            <p className="mt-3 rounded-[var(--radius-element)] border border-[var(--color-border)] bg-[var(--color-background-surface)] px-3 py-2 font-[family-name:var(--font-mono-code)] text-[12.5px] text-[var(--color-text-secondary)]">
              {s.code}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
