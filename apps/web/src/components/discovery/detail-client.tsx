"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Wand2 } from "lucide-react";
import { DiscoveryChat } from "./chat";
import { PrdPreview } from "./prd-preview";
import { trpc } from "@/lib/trpc/react";
import type { RouterOutputs } from "@/lib/trpc/types";

type Prd = RouterOutputs["prd"]["get"];

export function DiscoveryDetailClient({
  workspaceId,
  prd: initialPrd,
  defaultProvider,
}: {
  workspaceId: string;
  prd: Prd;
  defaultProvider: "OPENAI" | "ANTHROPIC";
}) {
  const utils = trpc.useUtils();
  const { data: prd } = trpc.prd.get.useQuery(
    { workspaceId, prdId: initialPrd.id },
    { initialData: initialPrd }
  );

  const [exchangeCount, setExchangeCount] = useState(0);
  const generateStructured = trpc.prd.generateStructured.useMutation({
    onSuccess: () => utils.prd.get.invalidate({ workspaceId, prdId: initialPrd.id }),
  });

  const canGenerate = exchangeCount >= 1 || (prd?.messages.length ?? 0) >= 2;

  return (
    <div className="grid h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[1fr_420px]">
      <div className="flex min-h-0 flex-col border-r border-[var(--color-border)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <div>
            <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{prd?.title}</p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">Discovery chat</p>
          </div>
          {prd?.status === "DRAFT" && (
            <Button
              label="Generate PRD"
              variant="primary"
              size="sm"
              icon={<Wand2 className="h-3.5 w-3.5" />}
              isLoading={generateStructured.isPending}
              isDisabled={!canGenerate}
              clickAction={async () => {
                await generateStructured.mutateAsync({ workspaceId, prdId: initialPrd.id, provider: defaultProvider });
              }}
            />
          )}
        </div>
        <div className="min-h-0 flex-1">
          <DiscoveryChat
            workspaceId={workspaceId}
            prdId={initialPrd.id}
            initialMessages={(prd?.messages ?? []).map((m: { role: string; content: string }) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
            }))}
            onExchangeComplete={() => setExchangeCount((c) => c + 1)}
          />
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto p-5">
        {prd && prd.status !== "DRAFT" ? (
          <PrdPreview prd={prd} workspaceId={workspaceId} />
        ) : (
          <p className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
            Once you and ShipFlow have talked through the details, click <strong>Generate PRD</strong> to
            turn the conversation into a structured PRD you can edit here.
          </p>
        )}
      </div>
    </div>
  );
}


