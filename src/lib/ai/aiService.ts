import { AIChatMessage, AIMoveAnalysisRequest } from "@/types/ai";

export interface AIService {
  analyzeMove(
    request: AIMoveAnalysisRequest,
    gameMetadata: string,
    apiKey: string
  ): Promise<string>;
  chat(
    messages: AIChatMessage[],
    apiKey: string,
    signal?: AbortSignal
  ): Promise<string>;
  validateApiKey(apiKey: string): Promise<boolean>;
}
