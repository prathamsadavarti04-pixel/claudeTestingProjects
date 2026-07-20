"use client";

import { useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Banner } from "@astryxdesign/core/Banner";
import { IconButton } from "@astryxdesign/core/IconButton";
import { useToast } from "@astryxdesign/core/Toast";
import { KeyRound, Trash2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import type { RouterOutputs } from "@/lib/trpc/types";

type ApiKeyRow = RouterOutputs["apiKey"]["list"][number];

export function ApiKeysPanel({
  workspaceId,
  initialKeys,
  canManage,
}: {
  workspaceId: string;
  initialKeys: ApiKeyRow[];
  canManage: boolean;
}) {
  const utils = trpc.useUtils();
  const toast = useToast();
  const { data: keys } = trpc.apiKey.list.useQuery({ workspaceId }, { initialData: initialKeys });

  const [provider, setProvider] = useState<"OPENAI" | "ANTHROPIC">("ANTHROPIC");
  const [key, setKey] = useState("");
  const [testResult, setTestResult] = useState<{ valid: boolean; message?: string } | null>(null);

  const testConnection = trpc.apiKey.testConnection.useMutation({ onSuccess: setTestResult });
  const saveKey = trpc.apiKey.upsert.useMutation({
    onSuccess: () => {
      utils.apiKey.list.invalidate({ workspaceId });
      setKey("");
      setTestResult(null);
      toast({ type: "info", body: `${provider === "ANTHROPIC" ? "Anthropic" : "OpenAI"} key saved` });
    },
  });
  const removeKey = trpc.apiKey.remove.useMutation({
    onSuccess: () => utils.apiKey.list.invalidate({ workspaceId }),
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-[60ch] text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
        ShipFlow calls the AI provider directly with your key for PRD generation and PR review. Keys are
        encrypted at rest (AES-256-GCM) and only decrypted server-side for the specific call that needs one.
      </p>

      {keys && keys.length > 0 && (
        <div className="flex flex-col gap-2">
          {keys.map((k: { id: string; provider: string; keyLast4: string; createdBy: { name: string }; lastVerifiedAt: string | Date | null }) => (
            <Card key={k.id} padding={3}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-4 w-4 text-[var(--color-icon-accent)]" />
                  <div>
                    <p className="text-[13.5px] font-medium text-[var(--color-text-primary)]">
                      {k.provider === "ANTHROPIC" ? "Anthropic" : "OpenAI"} · ••••{k.keyLast4}
                    </p>
                    <p className="text-[12px] text-[var(--color-text-secondary)]">
                      Added by {k.createdBy.name}
                      {k.lastVerifiedAt ? ` · verified ${new Date(k.lastVerifiedAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <IconButton
                    label="Remove key"
                    icon={<Trash2 className="h-4 w-4" />}
                    variant="ghost"
                    onClick={() => removeKey.mutate({ workspaceId, keyId: k.id })}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {canManage && (
        <Card padding={4}>
          <p className="mb-3 text-[13.5px] font-medium text-[var(--color-text-primary)]">Add a key</p>
          <div className="flex flex-col gap-3">
            <SegmentedControl
              label="Provider"
              value={provider}
              onChange={(v) => {
                setProvider(v as "OPENAI" | "ANTHROPIC");
                setTestResult(null);
              }}
            >
              <SegmentedControlItem value="ANTHROPIC" label="Anthropic" />
              <SegmentedControlItem value="OPENAI" label="OpenAI" />
            </SegmentedControl>
            <TextInput
              label="API key"
              isLabelHidden
              type="password"
              value={key}
              onChange={(v) => {
                setKey(v);
                setTestResult(null);
              }}
              placeholder={provider === "ANTHROPIC" ? "sk-ant-..." : "sk-..."}
            />
            {testResult && (
              <Banner
                status={testResult.valid ? "success" : "error"}
                title={testResult.valid ? "Key works" : "Couldn't verify this key"}
                description={testResult.valid ? undefined : testResult.message}
              />
            )}
            <div className="flex gap-2">
              <Button
                label="Test connection"
                variant="secondary"
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                isLoading={testConnection.isPending}
                isDisabled={key.length < 10}
                clickAction={async () => {
                  await testConnection.mutateAsync({ workspaceId, provider, key });
                }}
              />
              <Button
                label="Save key"
                variant="primary"
                isLoading={saveKey.isPending}
                isDisabled={!testResult?.valid}
                clickAction={async () => {
                  await saveKey.mutateAsync({ workspaceId, provider, key, label: `${provider} key` });
                }}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


