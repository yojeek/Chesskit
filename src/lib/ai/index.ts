import { AIProvider } from "@/types/ai";
import { AIService } from "./aiService";
import { OpenAIService } from "./openai";
import { AnthropicService } from "./anthropic";

export function createAIService(provider: AIProvider): AIService {
  switch (provider) {
    case AIProvider.OpenAI:
      return new OpenAIService();
    case AIProvider.Anthropic:
      return new AnthropicService();
    case AIProvider.DeepSeek:
      return new OpenAIService({
        baseUrl: "https://api.deepseek.com/chat/completions",
        model: "deepseek-chat",
        providerName: "DeepSeek",
        modelsUrl: undefined,
      });
  }
}
