import { Card } from "@astryxdesign/core/Card";
import { MessagesSquare, ListTodo, ShieldCheck, UserCheck } from "lucide-react";

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "AI-drafted PRDs",
    body: "Describe the feature in plain language. ShipFlow asks the clarifying questions a PM would, then drafts a structured PRD — problem, goals, user stories, edge cases.",
  },
  {
    icon: ListTodo,
    title: "Tasks that trace back to the spec",
    body: "Every task on the board links to the user story it came from, so \"why are we building this\" is never a Slack search away.",
  },
  {
    icon: ShieldCheck,
    title: "AI reviews every PR against it",
    body: "The moment a PR opens, ShipFlow pulls the diff, checks it against the linked PRD's goals and edge cases, and comments directly on GitHub.",
  },
  {
    icon: UserCheck,
    title: "Humans keep the final call",
    body: "AI can flag blocking issues and mark a PR ready — it can't ship it. Only an Admin or Reviewer can approve, by design.",
  },
] as const;

export function FeaturesGrid() {
  return (
    <section id="product" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-[52ch]">
        <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--color-text-accent)]">
          How it fits together
        </p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          One pipeline, not four disconnected tools
        </h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--color-text-secondary)]">
          Discovery, planning, and review usually live in separate tools that drift out of sync. ShipFlow
          keeps them connected on purpose.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title} padding={5}>
            <f.icon className="h-5 w-5 text-[var(--color-icon-accent)]" strokeWidth={1.75} />
            <h3 className="mt-3.5 text-[16px] font-semibold text-[var(--color-text-primary)]">{f.title}</h3>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--color-text-secondary)]">{f.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}


