import Link from "next/link";
import { Workflow } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background-body)] px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-element)] bg-[var(--color-accent)] text-[var(--color-on-accent)]">
          <Workflow className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          ShipFlow AI
        </span>
      </Link>
      <div className="w-full max-w-[380px]">{children}</div>
    </div>
  );
}


