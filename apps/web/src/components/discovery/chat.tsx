"use client";

import { useRef, useState } from "react";
import { ChatLayout } from "@astryxdesign/core/Chat";
import { ChatMessageList } from "@astryxdesign/core/Chat";
import { ChatMessage } from "@astryxdesign/core/Chat";
import { ChatMessageBubble } from "@astryxdesign/core/Chat";
import { ChatComposer } from "@astryxdesign/core/Chat";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function DiscoveryChat({
  workspaceId,
  prdId,
  initialMessages,
  onExchangeComplete,
}: {
  workspaceId: string;
  prdId: string;
  initialMessages: Message[];
  onExchangeComplete?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  async function send(value: string) {
    if (!value.trim() || isStreaming) return;
    setMessages((m) => [...m, { role: "user", content: value }]);
    setDraft("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/prd/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, prdId, message: value }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "Something went wrong.");
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${text}` }]);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        const piece = decoder.decode(chunk, { stream: true });
        setMessages((m) => {
          const next = [...m];
          const last = next[next.length - 1];
          if (last) next[next.length - 1] = { ...last, content: last.content + piece };
          return next;
        });
      }
    } finally {
      setIsStreaming(false);
      utils.prd.get.invalidate({ workspaceId, prdId });
      onExchangeComplete?.();
    }
  }

  return (
    <ChatLayout
      scrollRef={scrollRef}
      composer={
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          isDisabled={isStreaming}
          placeholder={isStreaming ? "ShipFlow is thinking…" : "Describe the feature, or answer the question above…"}
        />
      }
    >
      <ChatMessageList>
        {messages.map((m, i) => (
          <ChatMessage
            key={i}
            sender={m.role === "user" ? "user" : "assistant"}
            avatar={m.role === "assistant" ? <Avatar name="ShipFlow AI" size="small" /> : undefined}
            name={m.role === "assistant" ? "ShipFlow AI" : undefined}
          >
            <ChatMessageBubble variant={m.role === "assistant" ? "ghost" : "filled"}>
              {m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
            </ChatMessageBubble>
          </ChatMessage>
        ))}
        {messages.length === 0 && (
          <ChatMessage sender="assistant" avatar={<Avatar name="ShipFlow AI" size="small" />} name="ShipFlow AI">
            <ChatMessageBubble variant="ghost">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                What are you trying to build?
              </span>
            </ChatMessageBubble>
          </ChatMessage>
        )}
      </ChatMessageList>
    </ChatLayout>
  );
}


