import { AIService } from "./aiService";
import { Chess } from "chess.js";

export async function getLlmMove(
  fen: string,
  service: AIService,
  apiKey: string,
  signal?: AbortSignal
): Promise<string | null> {
  const game = new Chess(fen);
  const colorName = game.turn() === "w" ? "White" : "Black";
  const legalMoves = game
    .moves({ verbose: true })
    .map((m) => m.from + m.to + (m.promotion || ""));

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a professional chess player. You will be given a board position, the list of legal moves, and which color you play. Reply with ONLY `make_move <uci>` where <uci> is your chosen move in UCI notation (e.g. e2e4). Do not include any other text.",
    },
    {
      role: "user" as const,
      content: [
        `You play as ${colorName}.`,
        "",
        "Current board:",
        game.ascii(),
        "",
        `Legal moves: ${legalMoves.join(", ")}`,
        "",
        "What is your move?",
      ].join("\n"),
    },
  ];

  try {
    const response = await service.chat(messages, apiKey, signal);
    const match = response.match(/make_move\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);

    if (!match) return null;

    const move = match[1].toLowerCase();
    if (!legalMoves.includes(move)) return null;

    return move;
  } catch (error) {
    console.error("LLM move error:", error);
    return null;
  }
}
