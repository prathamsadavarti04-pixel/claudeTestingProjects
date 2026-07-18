import { Check, Minus, X } from "lucide-react";

type Cell = "yes" | "partial" | "no";

const ROWS: Array<{ label: string; shipflow: Cell; manual: Cell; none: Cell }> = [
  { label: "PRD generated from a raw request", shipflow: "yes", manual: "no", none: "no" },
  { label: "Every PR checked against the spec", shipflow: "yes", manual: "partial", none: "no" },
  { label: "Catches drift before merge, not after", shipflow: "yes", manual: "partial", none: "no" },
  { label: "Scales with team size without more reviewer hours", shipflow: "yes", manual: "no", none: "no" },
  { label: "Human still has final approval", shipflow: "yes", manual: "yes", none: "partial" },
  { label: "Bring your own AI provider key", shipflow: "yes", manual: "no", none: "no" },
];

const COLUMNS = [
  { key: "shipflow" as const, label: "ShipFlow AI", emphasize: true },
  { key: "manual" as const, label: "Manual review only" },
  { key: "none" as const, label: "No structured process" },
];

export function ComparisonTable() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-[52ch]">
        <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--color-text-accent)]">
          Why teams switch
        </p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          What changes when review is structured
        </h2>
      </div>

      <div className="mt-8 overflow-x-auto rounded-[var(--radius-container)] border border-[var(--color-border)] bg-[var(--color-background-surface)]">
        <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-5 py-4 font-medium text-[var(--color-text-secondary)]">&nbsp;</th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={`px-5 py-4 font-semibold ${
                    c.emphasize ? "text-[var(--color-text-accent)]" : "text-[var(--color-text-primary)]"
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={i !== ROWS.length - 1 ? "border-b border-[var(--color-border)]" : ""}
              >
                <td className="px-5 py-3.5 text-[var(--color-text-secondary)]">{row.label}</td>
                {COLUMNS.map((c) => (
                  <td key={c.key} className="px-5 py-3.5">
                    <CellIcon value={row[c.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CellIcon({ value }: { value: Cell }) {
  if (value === "yes") return <Check className="h-4.5 w-4.5 text-[var(--color-icon-green)]" strokeWidth={2.5} />;
  if (value === "partial") return <Minus className="h-4.5 w-4.5 text-[var(--color-icon-orange)]" strokeWidth={2.5} />;
  return <X className="h-4.5 w-4.5 text-[var(--color-icon-disabled)]" strokeWidth={2.5} />;
}
