"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Banner } from "@astryxdesign/core/Banner";
import { trpc } from "@/lib/trpc/react";

export default function ApiKeyOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("ws") ?? "";
  const slug = searchParams.get("slug") ?? "";
  const [provider, setProvider] = useState<"OPENAI" | "ANTHROPIC">("ANTHROPIC");
  const [key, setKey] = useState("");
  const [testResult, setTestResult] = useState<{ valid: boolean; message?: string } | null>(null);

  const testConnection = trpc.apiKey.testConnection.useMutation({
    onSuccess: (result) => setTestResult(result),
  });
  const saveKey = trpc.apiKey.upsert.useMutation({
    onSuccess: () => router.push(`/onboarding/github?ws=${workspaceId}&slug=${slug}`),
  });

  function next() {
    router.push(`/onboarding/github?ws=${workspaceId}&slug=${slug}`);
  }

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
        Add your AI provider key
      </h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        ShipFlow is bring-your-own-key: PRD generation and PR review run on your OpenAI or Anthropic key,
        billed directly by them. It's encrypted at rest and never shown again after you save it.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <SegmentedControl
          label="AI provider"
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
          label={provider === "ANTHROPIC" ? "Anthropic API key" : "OpenAI API key"}
          type="password"
          value={key}
          onChange={(v) => {
            setKey(v);
            setTestResult(null);
          }}
          placeholder={provider === "ANTHROPIC" ? "sk-ant-..." : "sk-..."}
          description={
            provider === "ANTHROPIC" ? "console.anthropic.com → API Keys" : "platform.openai.com → API Keys"
          }
        />

        {testResult && (
          <Banner
            status={testResult.valid ? "success" : "error"}
            title={testResult.valid ? "Key works" : "Couldn't verify this key"}
            description={testResult.valid ? undefined : testResult.message}
          />
        )}

        <div className="grid">
          <Button
            label="Test connection"
            variant="secondary"
            isLoading={testConnection.isPending}
            isDisabled={key.length < 10 || !workspaceId}
            clickAction={async () => {
              await testConnection.mutateAsync({ workspaceId, provider, key });
            }}
          />
        </div>

        <div className="grid">
          <Button
            label="Save and continue"
            variant="primary"
            size="lg"
            isLoading={saveKey.isPending}
            isDisabled={!testResult?.valid}
            clickAction={async () => {
              await saveKey.mutateAsync({ workspaceId, provider, key, label: `${provider} key` });
            }}
          />
        </div>

        <button
          type="button"
          onClick={next}
          className="text-center text-[13.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
        >
          Skip for now — I'll add this later
        </button>
      </div>
    </div>
  );
}


