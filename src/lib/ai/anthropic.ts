import { AIService } from "./aiService";
import {
  AIChatMessage,
  AIMoveAnalysisRequest,
  AIAnalysisError,
} from "@/types/ai";
import { MOVE_ANALYSIS_SYSTEM_PROMPT, buildMoveAnalysisPrompt } from "./prompt";

export class AnthropicService implements AIService {
  private readonly baseUrl = "https://api.anthropic.com/v1/messages";
  private readonly model = "claude-haiku-4-5-20251001";

  async analyzeMove(
    request: AIMoveAnalysisRequest,
    gameMetadata: string,
    apiKey: string
  ): Promise<string> {
    const prompt = buildMoveAnalysisPrompt(request, gameMetadata);

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: this.model,
        system: MOVE_ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      }),
    }).catch(() => {
      throw {
        type: "network",
        message: "Network error. Please check your connection.",
      } as AIAnalysisError;
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw {
        type: "unknown",
        message: "Empty response from Anthropic.",
      } as AIAnalysisError;
    }

    return content;
  }

  async chat(
    messages: AIChatMessage[],
    apiKey: string,
    signal?: AbortSignal
  ): Promise<string> {
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: this.model,
        system: systemMessage?.content || "",
        messages: nonSystemMessages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
      signal,
    }).catch(() => {
      throw {
        type: "network",
        message: "Network error. Please check your connection.",
      } as AIAnalysisError;
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw {
        type: "unknown",
        message: "Empty response from Anthropic.",
      } as AIAnalysisError;
    }

    return content;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 1,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async handleErrorResponse(
    response: Response
  ): Promise<AIAnalysisError> {
    if (response.status === 401) {
      return {
        type: "invalid_key",
        message:
          "Invalid API key. Please check your Anthropic API key in settings.",
      };
    }
    if (response.status === 429) {
      return {
        type: "rate_limit",
        message: "Rate limit exceeded. Please wait a moment and try again.",
      };
    }
    if (response.status >= 500) {
      return {
        type: "network",
        message:
          "Anthropic service temporarily unavailable. Please try again later.",
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      type: "unknown",
      message: data?.error?.message || `API error: ${response.status}`,
    };
  }
}
