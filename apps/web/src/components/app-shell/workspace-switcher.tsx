"use client";

import { useRouter } from "next/navigation";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { ChevronsUpDown, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc/react";

export function WorkspaceSwitcher({ currentSlug, currentName }: { currentSlug: string; currentName: string }) {
  const router = useRouter();
  const { data: workspaces } = trpc.workspace.listMine.useQuery();

  return (
    <DropdownMenu
      button={{ label: currentName, icon: <ChevronsUpDown className="h-4 w-4" />, variant: "ghost", size: "sm" }}
      hasChevron={false}
      items={[
        {
          type: "section",
          title: "Workspaces",
          items: (workspaces ?? [])
            .filter((w: { slug: string }) => w.slug !== currentSlug)
            .map((w: { name: string; slug: string }) => ({ label: w.name, onClick: () => router.push(`/w/${w.slug}`) })),
        },
        { type: "divider" },
        { label: "New workspace", icon: <Plus className="h-4 w-4" />, onClick: () => router.push("/onboarding/workspace") },
      ]}
    />
  );
}


