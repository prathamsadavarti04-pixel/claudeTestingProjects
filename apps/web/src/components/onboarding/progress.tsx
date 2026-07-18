"use client";

import { usePathname } from "next/navigation";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";

const STEPS = [
  { path: "/onboarding/workspace", label: "Workspace" },
  { path: "/onboarding/api-key", label: "AI key" },
  { path: "/onboarding/github", label: "GitHub" },
  { path: "/onboarding/invite", label: "Invite" },
] as const;

export function OnboardingProgress() {
  const pathname = usePathname();
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => pathname?.startsWith(s.path))
  );

  return (
    <div>
      <ProgressBar
        label="Onboarding progress"
        isLabelHidden
        value={currentIndex + 1}
        max={STEPS.length}
        variant="accent"
      />
      <div className="mt-2 flex justify-between text-[12.5px] text-[var(--color-text-secondary)]">
        {STEPS.map((s, i) => (
          <span
            key={s.path}
            className={i === currentIndex ? "font-medium text-[var(--color-text-primary)]" : ""}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
