import { GameEval } from "@/types/eval";
import { AIService } from "./aiService";
import { Chess } from "chess.js";
import { buildMoveAnalysisRequests } from "./helpers";
import { MoveClassification } from "@/types/enums";

export async function buildGameContext(
  service: AIService,
  gameEval: GameEval,
  game: Chess,
  apiKey: string,
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<string> {
  const headers = game.getHeaders();
  const metadataParts: string[] = [];
  if (headers.White) metadataParts.push(`White: ${headers.White}`);
  if (headers.Black) metadataParts.push(`Black: ${headers.Black}`);
  if (headers.WhiteElo) metadataParts.push(`WhiteElo: ${headers.WhiteElo}`);
  if (headers.BlackElo) metadataParts.push(`BlackElo: ${headers.BlackElo}`);
  if (headers.Event) metadataParts.push(`Event: ${headers.Event}`);
  if (headers.Date) metadataParts.push(`Date: ${headers.Date}`);
  if (headers.Result) metadataParts.push(`Result: ${headers.Result}`);
  if (headers.Termination)
    metadataParts.push(`Termination: ${headers.Termination}`);
  if (headers.TimeControl)
    metadataParts.push(`TimeControl: ${headers.TimeControl}`);
  const gameMetadata = metadataParts.join(" | ");

  const requests = buildMoveAnalysisRequests(gameEval, game);
  const total = requests.length;
  let completed = 0;

  const moveAnalyses: string[] = [];

  for (const request of requests) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    const skipClassifications = [
      MoveClassification.Opening,
      MoveClassification.Forced,
      MoveClassification.Best,
      MoveClassification.Excellent,
    ];

    const shouldSkip =
      request.classification &&
      skipClassifications.includes(request.classification);

    const dot = request.color === "w" ? "." : "...";
    const moveLabel = `${request.moveNumber}${dot} ${request.san}`;
    const classLabel = request.classification
      ? ` (${request.classification})`
      : "";

    if (shouldSkip) {
      moveAnalyses.push(`Move ${moveLabel}${classLabel}`);
    } else {
      const analysis = await service.analyzeMove(request, gameMetadata, apiKey);
      moveAnalyses.push(`Move ${moveLabel}${classLabel}: ${analysis}`);
    }

    completed++;
    onProgress(99 - Math.exp(-4 * (completed / total)) * 99);
  }

  const contextParts: string[] = [];
  contextParts.push("=== Game Metadata ===");
  contextParts.push(gameMetadata);
  contextParts.push(
    `White accuracy: ${gameEval.accuracy.white.toFixed(1)}% | Black accuracy: ${gameEval.accuracy.black.toFixed(1)}%`
  );
  if (gameEval.estimatedElo) {
    contextParts.push(
      `Estimated ELO — White: ${Math.round(gameEval.estimatedElo.white)}, Black: ${Math.round(gameEval.estimatedElo.black)}`
    );
  }
  contextParts.push("");
  contextParts.push("=== Move-by-Move Analysis ===");
  contextParts.push(...moveAnalyses);

  const context = contextParts.join("\n");

  console.log("Game Context:\n", context);

  return context;
}
