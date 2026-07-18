import { OnboardingProgress } from "@/components/onboarding/progress";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-background-body)]">
      <div className="mx-auto max-w-[520px] px-6 py-14">
        <OnboardingProgress />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
