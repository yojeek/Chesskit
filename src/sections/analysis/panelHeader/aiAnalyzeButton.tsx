import { Icon } from "@iconify/react";
import {
  gameAtom,
  gameEvalAtom,
  aiProviderAtom,
  aiOpenAIKeyAtom,
  aiAnthropicKeyAtom,
  aiDeepSeekKeyAtom,
  aiGameContextAtom,
  aiContextBuildingProgressAtom,
  aiChatMessagesAtom,
  aiChatLoadingAtom,
  aiErrorAtom,
} from "../states";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { LoadingButton } from "@mui/lab";
import { Typography } from "@mui/material";
import { createAIService } from "@/lib/ai";
import { AIAnalysisError, AIProvider } from "@/types/ai";
import { buildGameContext } from "@/lib/ai/contextBuilder";
import {
  CHAT_SYSTEM_PROMPT_TEMPLATE,
  INITIAL_CHAT_PROMPT,
} from "@/lib/ai/prompt";
import { logAnalyticsEvent } from "@/lib/firebase";
import { useRef } from "react";

export default function AIAnalyzeButton() {
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const provider = useAtomValue(aiProviderAtom);
  const openAIKey = useAtomValue(aiOpenAIKeyAtom);
  const anthropicKey = useAtomValue(aiAnthropicKeyAtom);
  const deepSeekKey = useAtomValue(aiDeepSeekKeyAtom);
  const [aiGameContext, setAiGameContext] = useAtom(aiGameContextAtom);
  const setProgress = useSetAtom(aiContextBuildingProgressAtom);
  const setChatMessages = useSetAtom(aiChatMessagesAtom);
  const [chatLoading, setChatLoading] = useAtom(aiChatLoadingAtom);
  const setError = useSetAtom(aiErrorAtom);
  const abortRef = useRef<AbortController | null>(null);

  const keyMap: Record<AIProvider, string> = {
    [AIProvider.OpenAI]: openAIKey,
    [AIProvider.Anthropic]: anthropicKey,
    [AIProvider.DeepSeek]: deepSeekKey,
  };
  const apiKey = keyMap[provider];
  const hasKey = apiKey.trim().length > 0;
  const progress = useAtomValue(aiContextBuildingProgressAtom);
  const isBuilding = progress > 0 && progress < 99;
  const canAnalyze = !!gameEval && hasKey && !isBuilding && !chatLoading;

  const handleAnalyze = async () => {
    if (!gameEval || !hasKey) return;

    // Reset state
    setError(undefined);
    setChatMessages([]);
    setAiGameContext(undefined);
    setProgress(0);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const service = createAIService(provider);

      // Phase 1: Build game context
      setProgress(1);
      const context = await buildGameContext(
        service,
        gameEval,
        game,
        apiKey,
        (p) => setProgress(p),
        abortController.signal
      );
      setAiGameContext(context);
      setProgress(0);

      // Phase 2: Initial chat message
      setChatLoading(true);
      const systemMessage = CHAT_SYSTEM_PROMPT_TEMPLATE(context);
      const messages = [
        { role: "system" as const, content: systemMessage },
        { role: "user" as const, content: INITIAL_CHAT_PROMPT },
      ];

      const response = await service.chat(
        messages,
        apiKey,
        abortController.signal
      );

      setChatMessages([...messages, { role: "assistant", content: response }]);

      logAnalyticsEvent("ai_analyze_game", {
        provider,
        moves: game.history().length,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const isAIError = error && typeof error === "object" && "type" in error;
      setError(
        isAIError
          ? (error as AIAnalysisError)
          : { type: "unknown", message: "Failed to analyze game" }
      );
    } finally {
      setProgress(0);
      setChatLoading(false);
      abortRef.current = null;
    }
  };

  if (!gameEval || !hasKey) return null;

  return (
    <LoadingButton
      variant="contained"
      size="small"
      startIcon={<Icon icon="mdi:brain" height={12} />}
      onClick={handleAnalyze}
      disabled={!canAnalyze}
      loading={isBuilding || chatLoading}
    >
      <Typography fontSize="0.9em" fontWeight="500" lineHeight="1.4em">
        {aiGameContext ? "AI Insights again" : "AI Insights"}
      </Typography>
    </LoadingButton>
  );
}
