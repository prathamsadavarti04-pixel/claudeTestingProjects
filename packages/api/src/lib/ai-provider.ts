import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { AiProvider } from "@shipflow/db";

/**
 * The whole point of BYOK: every call to this function takes a key that
 * came out of a specific workspace's encrypted ApiKey row, decrypted just
 * before use. There is no ambient/platform API key anywhere in this
 * codebase — if a workspace hasn't added a key, AI features are disabled
 * for that workspace, full stop.
 */
export function getModel(provider: AiProvider, apiKey: string, modelId?: string) {
  switch (provider) {
    case "OPENAI": {
      // Explicitly use OpenAI's official API. This prevents Netlify's
      // automatically injected AI Gateway URL from intercepting BYOK calls.
      const openai = createOpenAI({
        apiKey,
        baseURL: "https://api.openai.com/v1",
      });

      return openai(modelId ?? "gpt-4.1-mini");
    }

    case "ANTHROPIC": {
      // Explicitly use Anthropic's official API for the same reason.
      const anthropic = createAnthropic({
        apiKey,
        baseURL: "https://api.anthropic.com/v1",
      });

      return anthropic(modelId ?? "claude-sonnet-4-6");
    }

    default: {
      const exhaustive: never = provider;
      throw new Error(`Unsupported AI provider: ${exhaustive}`);
    }
  }
}

