"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { Card } from "@astryxdesign/core/Card";
import { trpc } from "@/lib/trpc/react";

export function NewPrdForm({
  workspaceId,
  slug,
  hasApiKey,
}: {
  workspaceId: string;
  slug: string;
  hasApiKey: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [rawRequest, setRawRequest] = useState("");

  const createPrd = trpc.prd.create.useMutation({
    onSuccess: (prd) => router.push(`/w/${slug}/discovery/${prd.id}`),
  });

  if (!hasApiKey) {
    return (
      <Banner
        status="info"
        title="Add an AI provider key to start discovery"
        description="Discovery uses your workspace's OpenAI or Anthropic key."
        endContent={<Button label="Add key" href={`/w/${slug}/settings/api-keys`} variant="secondary" size="sm" />}
      />
    );
  }

  return (
    <Card padding={4}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim() && rawRequest.trim().length >= 10) {
            createPrd.mutate({ workspaceId, title: title.trim(), rawRequest: rawRequest.trim() });
          }
        }}
      >
        <TextInput label="Title" value={title} onChange={setTitle} placeholder="Rate limiting for the public API" isRequired />
        <TextArea
          label="What do you want to build?"
          value={rawRequest}
          onChange={setRawRequest}
          placeholder="A few misbehaving API clients are hammering us — need per-key rate limits..."
          rows={3}
          isRequired
        />
        <div className="grid w-fit">
          <Button
            label="Start discovery"
            type="submit"
            variant="primary"
            isLoading={createPrd.isPending}
            isDisabled={!title.trim() || rawRequest.trim().length < 10}
          />
        </div>
        {createPrd.isError && (
          <p className="text-[13px] text-[var(--color-text-red)]">{createPrd.error.message}</p>
        )}
      </form>
    </Card>
  );
}


