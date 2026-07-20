import { SettingsTabs } from "@/components/settings/tabs";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-5 text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">Settings</h1>
      <SettingsTabs slug={slug} />
      <div className="mt-6">{children}</div>
    </div>
  );
}


