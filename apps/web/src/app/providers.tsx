"use client";

import Link from "next/link";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { LayerProvider } from "@astryxdesign/core/Layer";
import { matchaTheme } from "@astryxdesign/theme-matcha/built";
import { TRPCProvider } from "@/lib/trpc/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Theme theme={matchaTheme}>
      <LinkProvider component={Link}>
        <LayerProvider toast={{ position: "topEnd", maxVisible: 3 }}>
          <TRPCProvider>{children}</TRPCProvider>
        </LayerProvider>
      </LinkProvider>
    </Theme>
  );
}
