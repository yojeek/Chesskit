import { MoveClassification } from "./enums";

export enum AIProvider {
  OpenAI = "openai",
  Anthropic = "anthropic",
  DeepSeek = "deepseek",
}

export interface AIMoveAnalysisRequest {
  moveIndex: number;
  san: string;
  fen: string;
  color: "w" | "b";
  moveNumber: number;
  classification?: MoveClassification;
  opening?: string;
  eval: { cp?: number; mate?: number; depth: number };
  lines: {
    pv: string[];
    pvSan: string[];
    cp?: number;
    mate?: number;
    depth: number;
    multiPv: number;
  }[];
  bestMove?: string;
  bestMoveSan?: string;
}

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIAnalysisError {
  type: "invalid_key" | "rate_limit" | "network" | "unknown";
  message: string;
}
