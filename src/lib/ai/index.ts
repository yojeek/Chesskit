import { AIProvider } from "@/types/ai";
import { AIService } from "./aiService";
import { OpenAIService } from "./openai";
import { AnthropicService } from "./anthropic";

export function createAIService(
  provider: AIProvider,
  model?: string
): AIService {
  switch (provider) {
    case AIProvider.OpenAI:
      return new OpenAIService(model ? { model } : undefined);
    case AIProvider.Anthropic:
      return new AnthropicService(model);
    case AIProvider.DeepSeek:
      return new OpenAIService({
        baseUrl: "https://api.deepseek.com/chat/completions",
        model: model || "deepseek-chat",
        providerName: "DeepSeek",
        modelsUrl: undefined,
      });
  }
}
