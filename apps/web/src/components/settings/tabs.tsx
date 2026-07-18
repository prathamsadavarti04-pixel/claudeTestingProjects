"use client";

import { usePathname } from "next/navigation";

export function SettingsTabs({ slug }: { slug: string }) {
  const pathname = usePathname() ?? "";
  const base = `/w/${slug}/settings`;
  const tabs = [
    { href: `${base}/general`, label: "General" },
    { href: `${base}/members`, label: "Members" },
    { href: `${base}/api-keys`, label: "API keys" },
    { href: `${base}/github`, label: "GitHub" },
    { href: `${base}/billing`, label: "Billing" },
  ];

  return (
    <div className="flex gap-1 border-b border-[var(--color-border)]">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <a
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-3 py-2.5 text-[13.5px] transition-colors ${
              isActive
                ? "border-[var(--color-accent)] font-medium text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab.label}
          </a>
        );
      })}
    </div>
  );
}
