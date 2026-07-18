"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { GitBranch as Github, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc/react";

export default function GithubOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("ws") ?? "";
  const slug = searchParams.get("slug") ?? "";
  const { data: connection, isLoading } = trpc.github.getConnection.useQuery(
    { workspaceId },
    { enabled: !!workspaceId }
  );

  function next() {
    router.push(`/onboarding/invite?ws=${workspaceId}&slug=${slug}`);
  }

  const installUrl = connection?.appSlug
    ? `https://github.com/apps/${connection.appSlug}/installations/new?state=${workspaceId}`
    : null;

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
        Connect GitHub
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        Install the ShipFlow GitHub App on the repos you want reviewed. It only needs pull request and
        contents (read) access — it comments on PRs, it doesn't push commits.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {!isLoading && connection?.connected && (
          <Banner
            status="success"
            title={`Connected to ${connection.accountLogin}`}
            description={`${connection.repos.length} repositor${connection.repos.length === 1 ? "y" : "ies"} available. You can choose which ones get AI review in Settings → GitHub.`}
          />
        )}

        {!isLoading && !connection?.connected && !connection?.appConfigured && (
          <Banner
            status="info"
            title="GitHub App not set up yet"
            description="Whoever's self-hosting this instance needs to register a GitHub App and add its credentials to .env first — see .env.example. You can skip this step and connect it later from Settings → GitHub."
          />
        )}

        {!isLoading && !connection?.connected && connection?.appConfigured && installUrl && (
          <div className="grid">
            <Button
              label="Install on GitHub"
              variant="primary"
              size="lg"
              icon={<Github className="h-4 w-4" />}
              href={installUrl}
            />
          </div>
        )}

        {connection?.connected && (
          <div className="flex items-center gap-2 text-[13.5px] text-[var(--color-text-secondary)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-icon-green)]" />
            GitHub connected
          </div>
        )}

        <button
          type="button"
          onClick={next}
          className="text-center text-[13.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
        >
          {connection?.connected ? "Continue" : "Skip for now — I'll connect this later"}
        </button>
      </div>
    </div>
  );
}
