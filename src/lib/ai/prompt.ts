import { AIMoveAnalysisRequest } from "@/types/ai";
import { MoveClassification } from "@/types/enums";

export const MOVE_ANALYSIS_SYSTEM_PROMPT =
  "You are a chess analysis expert. Given data about a single move in a chess game (including Stockfish engine evaluation and principal variations), provide a concise 2-3 sentence analysis of that move. Focus on what the move does strategically or tactically, and if it's a mistake or blunder, explain what went wrong and why the engine's preferred line is better. Use algebraic notation when referencing moves.";

export function buildMoveAnalysisPrompt(
  request: AIMoveAnalysisRequest,
  gameMetadata: string
): string {
  const colorName = request.color === "w" ? "White" : "Black";
  const moveLabel = `${request.moveNumber}${request.color === "w" ? "." : "..."} ${request.san}`;

  const formatEval = (cp?: number, mate?: number) => {
    if (mate !== undefined) return `M${mate}`;
    if (cp !== undefined) return `${cp > 0 ? "+" : ""}${(cp / 100).toFixed(2)}`;
    return "0.00";
  };

  let prompt = `Game: ${gameMetadata}\n`;
  prompt += `Move: ${moveLabel} (${colorName})`;
  if (request.classification) prompt += ` [${request.classification}]`;
  if (request.opening) prompt += ` | Opening: ${request.opening}`;
  prompt += `\nPosition FEN: ${request.fen}`;
  prompt += `\nEval after move: ${formatEval(request.eval.cp, request.eval.mate)} (depth ${request.eval.depth})`;

  if (request.lines.length > 0) {
    prompt += "\n\nEngine lines:";
    for (const line of request.lines) {
      prompt += `\n  PV${line.multiPv}: ${line.pvSan.join(" ")} (${formatEval(line.cp, line.mate)}, depth ${line.depth})`;
    }
  }

  if (request.bestMoveSan && request.bestMoveSan !== request.san) {
    prompt += `\nBest move was: ${request.bestMoveSan}`;
  }

  const isError =
    request.classification === MoveClassification.Blunder ||
    request.classification === MoveClassification.Mistake ||
    request.classification === MoveClassification.Inaccuracy;

  if (isError) {
    prompt += `\n\nThis move is classified as a ${request.classification}. Explain what went wrong and why the engine's preferred continuation is better.`;
  }

  return prompt;
}

export function CHAT_SYSTEM_PROMPT_TEMPLATE(gameContext: string): string {
  return `You are a chess analysis assistant. You have deep knowledge of a chess game based on Stockfish engine analysis. Use the game context below to answer the user's questions about the game, specific moves, positions, strategies, and patterns.

Be conversational, insightful, and reference specific moves and positions when relevant. Use algebraic notation. Keep responses focused and concise.

=== GAME CONTEXT ===
${gameContext}
=== END GAME CONTEXT ===`;
}

export const INITIAL_CHAT_PROMPT =
  "Give me a brief overview of this game in 3-5 sentences. Highlight the key turning points and the overall flow of the game.";
