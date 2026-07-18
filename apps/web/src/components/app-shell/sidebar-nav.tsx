"use client";

import { usePathname } from "next/navigation";
import { SideNav } from "@astryxdesign/core/SideNav";
import { SideNavItem } from "@astryxdesign/core/SideNav";
import { SideNavSection } from "@astryxdesign/core/SideNav";
import {
  LayoutDashboard,
  MessagesSquare,
  KanbanSquare,
  GitPullRequest,
  Settings,
} from "lucide-react";

export function DashboardSideNav({ slug }: { slug: string }) {
  const pathname = usePathname() ?? "";
  const base = `/w/${slug}`;
  const is = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <SideNav
      collapsible
      resizable={{ defaultWidth: 240, minWidth: 200, maxWidth: 320, autoSaveId: "shipflow-sidenav" }}
    >
      <SideNavSection title="Workspace">
        <SideNavItem label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} href={base} isSelected={pathname === base} />
        <SideNavItem
          label="Discovery"
          icon={<MessagesSquare className="h-4 w-4" />}
          href={`${base}/discovery`}
          isSelected={is(`${base}/discovery`)}
        />
        <SideNavItem
          label="Tasks"
          icon={<KanbanSquare className="h-4 w-4" />}
          href={`${base}/tasks`}
          isSelected={is(`${base}/tasks`)}
        />
        <SideNavItem
          label="Pull requests"
          icon={<GitPullRequest className="h-4 w-4" />}
          href={`${base}/pull-requests`}
          isSelected={is(`${base}/pull-requests`)}
        />
      </SideNavSection>

      <SideNavSection title="Manage">
        <SideNavItem
          label="Settings"
          icon={<Settings className="h-4 w-4" />}
          href={`${base}/settings/general`}
          isSelected={is(`${base}/settings`)}
        />
      </SideNavSection>
    </SideNav>
  );
}
