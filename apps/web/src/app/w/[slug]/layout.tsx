import { redirect } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { AppShell } from "@astryxdesign/core/AppShell";
import { TopNav } from "@astryxdesign/core/TopNav";
import { Workflow } from "lucide-react";
import { getServerSession } from "@/lib/get-session";
import { createServerCaller } from "@/lib/trpc/server";
import { DashboardSideNav } from "@/components/app-shell/sidebar-nav";
import { WorkspaceSwitcher } from "@/components/app-shell/workspace-switcher";
import { UserMenu } from "@/components/app-shell/user-menu";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession();
  if (!session?.user) redirect(`/login?next=/w/${slug}`);

  const caller = await createServerCaller();
  let workspace;
  try {
    workspace = await caller.workspace.getBySlug({ slug });
  } catch (err) {
    if (err instanceof TRPCError && (err.code === "NOT_FOUND" || err.code === "FORBIDDEN")) {
      redirect("/");
    }
    throw err;
  }

  return (
    <AppShell
      variant="elevated"
      contentPadding={0}
      topNav={
        <TopNav
          label="Main navigation"
          heading={
            <a href="/" className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-element)] bg-[var(--color-accent)] text-[var(--color-on-accent)]">
                <Workflow className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>
            </a>
          }
          startContent={<WorkspaceSwitcher currentSlug={workspace.slug} currentName={workspace.name} />}
          endContent={<UserMenu name={session.user.name} slug={workspace.slug} />}
        />
      }
      sideNav={<DashboardSideNav slug={workspace.slug} />}
    >
      {children}
    </AppShell>
  );
}
