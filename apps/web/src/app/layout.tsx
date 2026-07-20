import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ShipFlow AI — PRDs, tasks, and PR review that stay in sync",
  description:
    "Turn a raw feature request into a structured PRD, plan it into tasks, and have AI review every pull request against the spec before a human has to.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}


