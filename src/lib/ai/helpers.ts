import { GameEval } from "@/types/eval";
import { AIMoveAnalysisRequest } from "@/types/ai";
import { Chess } from "chess.js";
import { moveLineUciToSan, formatUciPv } from "@/lib/chess";

export function buildMoveAnalysisRequests(
  gameEval: GameEval,
  game: Chess
): AIMoveAnalysisRequest[] {
  const history = game.history({ verbose: true });
  const requests: AIMoveAnalysisRequest[] = [];

  for (let i = 1; i < gameEval.positions.length; i++) {
    const pos = gameEval.positions[i];
    const move = history[i - 1];
    if (!move) continue;

    const moveIndex = i - 1;
    const color = moveIndex % 2 === 0 ? "w" : "b";
    const moveNumber = Math.floor(moveIndex / 2) + 1;
    const fen = move.before;
    const bestLine = pos.lines[0];

    const toSan = moveLineUciToSan(fen);

    const lines = pos.lines.map((line) => {
      const formattedPv = formatUciPv(fen, line.pv);
      const pvSan: string[] = [];
      const converter = moveLineUciToSan(fen);
      for (const uci of formattedPv) {
        pvSan.push(converter(uci));
      }
      return {
        pv: line.pv,
        pvSan,
        cp: line.cp,
        mate: line.mate,
        depth: line.depth,
        multiPv: line.multiPv,
      };
    });

    let bestMoveSan: string | undefined;
    if (pos.bestMove) {
      const formattedBest = formatUciPv(fen, [pos.bestMove]);
      bestMoveSan = toSan(formattedBest[0]);
    }

    requests.push({
      moveIndex,
      san: move.san,
      fen,
      color: color as "w" | "b",
      moveNumber,
      classification: pos.moveClassification,
      opening: pos.opening,
      eval: {
        cp: bestLine?.cp,
        mate: bestLine?.mate,
        depth: bestLine?.depth ?? 0,
      },
      lines,
      bestMove: pos.bestMove,
      bestMoveSan,
    });
  }

  return requests;
}
