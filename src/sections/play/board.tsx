import { useAtomValue, useSetAtom } from "jotai";
import {
  engineEloAtom,
  gameAtom,
  playerColorAtom,
  isGameInProgressAtom,
  gameDataAtom,
  enginePlayNameAtom,
  isLlmOpponentAtom,
} from "./states";
import {
  aiProviderAtom,
  aiOpenAIKeyAtom,
  aiAnthropicKeyAtom,
  aiDeepSeekKeyAtom,
} from "@/sections/analysis/states";
import { useChessActions } from "@/hooks/useChessActions";
import { useEffect, useMemo } from "react";
import { useScreenSize } from "@/hooks/useScreenSize";
import { useEngine } from "@/hooks/useEngine";
import { uciMoveParams } from "@/lib/chess";
import Board from "@/components/board";
import { useGameData } from "@/hooks/useGameData";
import { usePlayersData } from "@/hooks/usePlayersData";
import { sleep } from "@/lib/helpers";
import { createAIService } from "@/lib/ai";
import { getLlmMove } from "@/lib/ai/llmChess";
import { AIProvider } from "@/types/ai";

export default function BoardContainer() {
  const screenSize = useScreenSize();
  const isLlmOpponent = useAtomValue(isLlmOpponentAtom);
  const engineName = useAtomValue(enginePlayNameAtom);
  const engine = useEngine(isLlmOpponent ? undefined : engineName);
  const game = useAtomValue(gameAtom);
  const { white, black } = usePlayersData(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const { playMove } = useChessActions(gameAtom);
  const engineElo = useAtomValue(engineEloAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const setIsGameInProgress = useSetAtom(isGameInProgressAtom);

  const aiProvider = useAtomValue(aiProviderAtom);
  const openAIKey = useAtomValue(aiOpenAIKeyAtom);
  const anthropicKey = useAtomValue(aiAnthropicKeyAtom);
  const deepSeekKey = useAtomValue(aiDeepSeekKeyAtom);

  const keyMap: Record<AIProvider, string> = {
    [AIProvider.OpenAI]: openAIKey,
    [AIProvider.Anthropic]: anthropicKey,
    [AIProvider.DeepSeek]: deepSeekKey,
  };

  const gameFen = game.fen();
  const isGameFinished = game.isGameOver();

  useEffect(() => {
    const playOpponentMove = async () => {
      if (game.turn() === playerColor || isGameFinished || !isGameInProgress) {
        return;
      }

      if (isLlmOpponent) {
        const timePromise = sleep(1000);
        const service = createAIService(aiProvider);
        const apiKey = keyMap[aiProvider];
        const move = await getLlmMove(gameFen, service, apiKey);
        await timePromise;

        if (move) {
          playMove(uciMoveParams(move));
        } else {
          setIsGameInProgress(false);
        }
      } else {
        if (!engine?.getIsReady()) return;

        const timePromise = sleep(1000);
        const move = await engine.getEngineNextMove(gameFen, engineElo);
        await timePromise;

        if (move) playMove(uciMoveParams(move));
      }
    };
    playOpponentMove();

    return () => {
      if (!isLlmOpponent) engine?.stopAllCurrentJobs();
    };
  }, [gameFen, isGameInProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  const boardSize = useMemo(() => {
    const width = screenSize.width;
    const height = screenSize.height;

    // 900 is the md layout breakpoint
    if (window?.innerWidth < 900) {
      return Math.min(width, height - 150);
    }

    return Math.min(width - 300, height * 0.83);
  }, [screenSize]);

  useGameData(gameAtom, gameDataAtom);

  return (
    <Board
      id="PlayBoard"
      canPlay={isGameInProgress ? playerColor : false}
      gameAtom={gameAtom}
      boardSize={boardSize}
      whitePlayer={white}
      blackPlayer={black}
      boardOrientation={playerColor}
      currentPositionAtom={gameDataAtom}
    />
  );
}
