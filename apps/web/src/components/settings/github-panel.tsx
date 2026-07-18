"use client";

import { Card } from "@astryxdesign/core/Card";
import { Switch } from "@astryxdesign/core/Switch";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { GitBranch as Github } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import type { RouterOutputs } from "@/lib/trpc/types";

type Connection = RouterOutputs["github"]["getConnection"];

export function GithubPanel({
  workspaceId,
  initialConnection,
  canManage,
}: {
  workspaceId: string;
  initialConnection: Connection;
  canManage: boolean;
}) {
  const utils = trpc.useUtils();
  const { data: connection } = trpc.github.getConnection.useQuery(
    { workspaceId },
    { initialData: initialConnection }
  );
  const toggleRepo = trpc.github.toggleRepo.useMutation({
    onSuccess: () => utils.github.getConnection.invalidate({ workspaceId }),
  });
  const disconnect = trpc.github.disconnect.useMutation({
    onSuccess: () => utils.github.getConnection.invalidate({ workspaceId }),
  });

  if (!connection?.appConfigured) {
    return (
      <Banner
        status="info"
        title="GitHub App not set up on this instance"
        description="Register a GitHub App and set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_WEBHOOK_SECRET in .env — see .env.example for the exact permissions and webhook URL needed."
      />
    );
  }

  if (!connection.connected) {
    return (
      <Card padding={5}>
        <Github className="h-6 w-6 text-[var(--color-icon-accent)]" />
        <p className="mt-3 text-[14px] font-medium text-[var(--color-text-primary)]">Not connected</p>
        <p className="mt-1 text-[13.5px] text-[var(--color-text-secondary)]">
          Install the ShipFlow GitHub App to enable AI review on your pull requests.
        </p>
        {canManage && (
          <div className="mt-4 grid w-fit">
            <Button
              label="Install on GitHub"
              variant="primary"
              icon={<Github className="h-4 w-4" />}
              href={`https://github.com/apps/${connection.appSlug}/installations/new?state=${workspaceId}`}
            />
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Banner status="success" title={`Connected to ${connection.accountLogin}`} />

      <div>
        <p className="mb-2 text-[13px] font-medium text-[var(--color-text-secondary)]">
          Repositories reviewed by AI
        </p>
        <div className="flex flex-col gap-2">
          {connection.repos.map((repo: { id: string; fullName: string; isActive: boolean }) => (
            <Card key={repo.id} padding={3}>
              <div className="flex items-center justify-between">
                <p className="text-[13.5px] text-[var(--color-text-primary)]">{repo.fullName}</p>
                <Switch
                  label={`Review PRs in ${repo.fullName}`}
                  isLabelHidden
                  value={repo.isActive}
                  isDisabled={!canManage}
                  onChange={(isActive) => toggleRepo.mutate({ workspaceId, repoId: repo.id, isActive })}
                />
              </div>
            </Card>
          ))}
          {connection.repos.length === 0 && (
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              No repositories yet — add some from the GitHub App's settings page.
            </p>
          )}
        </div>
      </div>

      {canManage && (
        <div className="grid w-fit">
          <Button
            label="Disconnect"
            variant="destructive"
            size="sm"
            onClick={() => disconnect.mutate({ workspaceId })}
          />
        </div>
      )}
    </div>
  );
}
