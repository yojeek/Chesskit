import { useAtomValue } from "jotai";
import {
  gameAtom,
  isGameInProgressAtom,
  isLlmOpponentAtom,
  playerColorAtom,
} from "./states";
import { Button, Grid2 as Grid, Typography } from "@mui/material";
import { Color } from "@/types/enums";
import { setGameHeaders } from "@/lib/chess";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "next/router";

export default function GameRecap() {
  const game = useAtomValue(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const isLlmOpponent = useAtomValue(isLlmOpponentAtom);
  const { addGame } = useGameDatabase();
  const router = useRouter();

  if (isGameInProgress || !game.history().length) return null;

  const opponentLabel = isLlmOpponent ? "LLM" : "Stockfish";

  const getResultLabel = () => {
    if (game.isCheckmate()) {
      const winnerColor = game.turn() === "w" ? Color.Black : Color.White;
      const winnerLabel = winnerColor === playerColor ? "You" : opponentLabel;
      return `${winnerLabel} won by checkmate !`;
    }
    if (game.isInsufficientMaterial()) return "Draw by insufficient material";
    if (game.isStalemate()) return "Draw by stalemate";
    if (game.isThreefoldRepetition()) return "Draw by threefold repetition";
    if (game.isDraw()) return "Draw by fifty-move rule";

    if (isLlmOpponent && !game.isGameOver()) {
      return "LLM resigned (invalid move)";
    }

    return "You resigned";
  };

  const handleOpenGameAnalysis = async () => {
    const resigned = !game.isGameOver()
      ? isLlmOpponent
        ? playerColor === Color.White
          ? Color.Black
          : Color.White
        : playerColor
      : undefined;

    const gameToAnalysis = setGameHeaders(game, { resigned });
    const gameId = await addGame(gameToAnalysis);

    router.push({ pathname: "/", query: { gameId } });
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={2}
      size={12}
    >
      <Grid container justifyContent="center" size={12}>
        <Typography>{getResultLabel()}</Typography>
      </Grid>

      <Button variant="outlined" onClick={handleOpenGameAnalysis}>
        Open game analysis
      </Button>
    </Grid>
  );
}
