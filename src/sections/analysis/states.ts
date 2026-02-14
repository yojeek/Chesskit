import { DEFAULT_ENGINE } from "@/constants";
import { getRecommendedWorkersNb } from "@/lib/engine/worker";
import { EngineName } from "@/types/enums";
import { AIChatMessage, AIAnalysisError, AIProvider } from "@/types/ai";
import { CurrentPosition, GameEval, SavedEvals } from "@/types/eval";
import { Chess } from "chess.js";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const gameEvalAtom = atom<GameEval | undefined>(undefined);
export const gameAtom = atom(new Chess());
export const boardAtom = atom(new Chess());
export const currentPositionAtom = atom<CurrentPosition>({});

export const boardOrientationAtom = atom(true);
export const showBestMoveArrowAtom = atom(true);
export const showPlayerMoveIconAtom = atom(true);

export const engineNameAtom = atom<EngineName>(DEFAULT_ENGINE);
export const engineDepthAtom = atom(14);
export const engineMultiPvAtom = atom(3);
export const engineWorkersNbAtom = atomWithStorage(
  "engineWorkersNb",
  getRecommendedWorkersNb()
);
export const evaluationProgressAtom = atom(0);

export const savedEvalsAtom = atom<SavedEvals>({});

export const aiContextBuildingProgressAtom = atom(0);
export const aiGameContextAtom = atom<string | undefined>(undefined);
export const aiMoveAnalysesAtom = atom<(string | undefined)[]>([]);
export const aiChatMessagesAtom = atom<AIChatMessage[]>([]);
export const aiChatLoadingAtom = atom(false);
export const aiErrorAtom = atom<AIAnalysisError | undefined>(undefined);
export const aiProviderAtom = atomWithStorage<AIProvider>(
  "ai-provider",
  AIProvider.OpenAI
);
export const aiOpenAIKeyAtom = atomWithStorage<string>("ai-api-key", "");
export const aiAnthropicKeyAtom = atomWithStorage<string>(
  "ai-anthropic-key",
  ""
);
export const aiDeepSeekKeyAtom = atomWithStorage<string>("ai-deepseek-key", "");
