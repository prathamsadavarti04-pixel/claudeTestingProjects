"use client";

import { useRouter } from "next/navigation";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Avatar } from "@astryxdesign/core/Avatar";
import { LogOut, Settings } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function UserMenu({ name, slug }: { name: string; slug: string }) {
  const router = useRouter();

  return (
    <DropdownMenu
      button={{ label: name, isIconOnly: true, icon: <Avatar name={name} size="small" />, variant: "ghost" }}
      hasChevron={false}
      items={[
        {
          label: "Workspace settings",
          icon: <Settings className="h-4 w-4" />,
          onClick: () => router.push(`/w/${slug}/settings/general`),
        },
        { type: "divider" },
        {
          label: "Sign out",
          icon: <LogOut className="h-4 w-4" />,
          onClick: () => signOut({ fetchOptions: { onSuccess: () => router.push("/login") } }),
        },
      ]}
    />
  );
}
