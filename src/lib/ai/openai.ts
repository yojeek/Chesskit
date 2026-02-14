import { AIService } from "./aiService";
import {
  AIChatMessage,
  AIMoveAnalysisRequest,
  AIAnalysisError,
} from "@/types/ai";
import { MOVE_ANALYSIS_SYSTEM_PROMPT, buildMoveAnalysisPrompt } from "./prompt";

interface OpenAIServiceConfig {
  baseUrl: string;
  model: string;
  providerName: string;
  modelsUrl?: string;
}

const OPENAI_DEFAULTS: OpenAIServiceConfig = {
  baseUrl: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
  providerName: "OpenAI",
  modelsUrl: "https://api.openai.com/v1/models",
};

export class OpenAIService implements AIService {
  private readonly config: OpenAIServiceConfig;

  constructor(config?: Partial<OpenAIServiceConfig>) {
    this.config = { ...OPENAI_DEFAULTS, ...config };
  }

  async analyzeMove(
    request: AIMoveAnalysisRequest,
    gameMetadata: string,
    apiKey: string
  ): Promise<string> {
    const prompt = buildMoveAnalysisPrompt(request, gameMetadata);

    const response = await fetch(this.config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: MOVE_ANALYSIS_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
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
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw {
        type: "unknown",
        message: `Empty response from ${this.config.providerName}.`,
      } as AIAnalysisError;
    }

    return content;
  }

  async chat(
    messages: AIChatMessage[],
    apiKey: string,
    signal?: AbortSignal
  ): Promise<string> {
    const response = await fetch(this.config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
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
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw {
        type: "unknown",
        message: `Empty response from ${this.config.providerName}.`,
      } as AIAnalysisError;
    }

    return content;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!this.config.modelsUrl) {
      try {
        const response = await fetch(this.config.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 1,
          }),
        });
        return response.ok;
      } catch {
        return false;
      }
    }
    try {
      const response = await fetch(this.config.modelsUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
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
        message: `Invalid API key. Please check your ${this.config.providerName} API key in settings.`,
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
        message: `${this.config.providerName} service temporarily unavailable. Please try again later.`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      type: "unknown",
      message: data?.error?.message || `API error: ${response.status}`,
    };
  }
}
