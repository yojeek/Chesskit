import Slider from "@/components/slider";
import { Color, EngineName } from "@/types/enums";
import {
  MenuItem,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  OutlinedInput,
  DialogActions,
  Typography,
  Grid2 as Grid,
  FormGroup,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { useAtomLocalStorage } from "@/hooks/useAtomLocalStorage";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  engineEloAtom,
  playerColorAtom,
  isGameInProgressAtom,
  gameAtom,
  enginePlayNameAtom,
  isLlmOpponentAtom,
} from "../states";
import {
  aiProviderAtom,
  aiOpenAIKeyAtom,
  aiAnthropicKeyAtom,
  aiDeepSeekKeyAtom,
} from "@/sections/analysis/states";
import { useChessActions } from "@/hooks/useChessActions";
import { logAnalyticsEvent } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { isEngineSupported } from "@/lib/engine/shared";
import { Stockfish16_1 } from "@/lib/engine/stockfish16_1";
import { DEFAULT_ENGINE, ENGINE_LABELS, STRONGEST_ENGINE } from "@/constants";
import { getGameFromPgn } from "@/lib/chess";
import { AIProvider } from "@/types/ai";

const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  [AIProvider.OpenAI]: "ChatGPT",
  [AIProvider.Anthropic]: "Claude",
  [AIProvider.DeepSeek]: "DeepSeek",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GameSettingsDialog({ open, onClose }: Props) {
  const [engineElo, setEngineElo] = useAtomLocalStorage(
    "engine-elo",
    engineEloAtom
  );
  const [engineName, setEngineName] = useAtomLocalStorage(
    "engine-play-name",
    enginePlayNameAtom
  );
  const [playerColor, setPlayerColor] = useAtom(playerColorAtom);
  const setIsGameInProgress = useSetAtom(isGameInProgressAtom);
  const setIsLlmOpponent = useSetAtom(isLlmOpponentAtom);
  const { reset: resetGame } = useChessActions(gameAtom);
  const [startingPositionInput, setStartingPositionInput] = useState("");
  const [parsingError, setParsingError] = useState("");
  const [llmToggle, setLlmToggle] = useState(false);

  const aiProvider = useAtomValue(aiProviderAtom);
  const openAIKey = useAtomValue(aiOpenAIKeyAtom);
  const anthropicKey = useAtomValue(aiAnthropicKeyAtom);
  const deepSeekKey = useAtomValue(aiDeepSeekKeyAtom);

  const keyMap: Record<AIProvider, string> = {
    [AIProvider.OpenAI]: openAIKey,
    [AIProvider.Anthropic]: anthropicKey,
    [AIProvider.DeepSeek]: deepSeekKey,
  };
  const hasAiKey = keyMap[aiProvider].trim().length > 0;

  const opponentName = llmToggle
    ? AI_PROVIDER_LABELS[aiProvider]
    : ENGINE_LABELS[engineName].small;

  const handleGameStart = () => {
    setParsingError("");

    try {
      const input = startingPositionInput.trim();
      const startingFen = input.startsWith("[")
        ? getGameFromPgn(input).fen()
        : input || undefined;

      resetGame({
        white: {
          name: playerColor === Color.White ? "You" : opponentName,
          rating:
            playerColor === Color.White || llmToggle ? undefined : engineElo,
        },
        black: {
          name: playerColor === Color.Black ? "You" : opponentName,
          rating:
            playerColor === Color.Black || llmToggle ? undefined : engineElo,
        },
        fen: startingFen,
      });
    } catch (error) {
      console.error(error);
      setParsingError(
        error instanceof Error
          ? `${error.message} !`
          : "Unknown error while parsing input !"
      );
      return;
    }

    setIsLlmOpponent(llmToggle);
    setIsGameInProgress(true);
    handleClose();

    logAnalyticsEvent("play_game", {
      engine: llmToggle ? `llm-${aiProvider}` : engineName,
      engineElo: llmToggle ? undefined : engineElo,
      playerColor,
    });
  };

  useEffect(() => {
    if (!isEngineSupported(engineName)) {
      if (Stockfish16_1.isSupported()) {
        setEngineName(EngineName.Stockfish16_1Lite);
      } else {
        setEngineName(EngineName.Stockfish11);
      }
    }
  }, [setEngineName, engineName]);

  const handleClose = () => {
    onClose();
    setStartingPositionInput("");
    setParsingError("");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle marginY={1} variant="h5">
        Set game parameters
      </DialogTitle>
      <DialogContent sx={{ paddingBottom: 0 }}>
        {!llmToggle && (
          <Typography>
            {ENGINE_LABELS[DEFAULT_ENGINE].small} is the default engine if your
            device support its requirements. It offers the best balance between
            speed and strength. {ENGINE_LABELS[STRONGEST_ENGINE].small} is the
            strongest engine available, note that it requires a one time
            download of 75MB.
          </Typography>
        )}
        {llmToggle && (
          <Typography>
            Play against {AI_PROVIDER_LABELS[aiProvider]}. The LLM receives the
            board position and legal moves, then picks a move. If it returns an
            invalid move, it counts as resignation.
          </Typography>
        )}
        <Grid
          marginTop={4}
          container
          justifyContent="center"
          alignItems="center"
          rowGap={3}
          size={12}
        >
          {hasAiKey && (
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    color="default"
                    checked={llmToggle}
                    onChange={(e) => setLlmToggle(e.target.checked)}
                  />
                }
                label="Play against LLM"
              />
            </FormGroup>
          )}

          {!llmToggle && (
            <>
              <Grid container justifyContent="center" size={12}>
                <FormControl variant="outlined">
                  <InputLabel id="dialog-select-label">
                    Bot&apos;s engine
                  </InputLabel>
                  <Select
                    labelId="dialog-select-label"
                    id="dialog-select"
                    displayEmpty
                    input={<OutlinedInput label="Engine" />}
                    value={engineName}
                    onChange={(e) =>
                      setEngineName(e.target.value as EngineName)
                    }
                    sx={{ width: 280, maxWidth: "100%" }}
                  >
                    {Object.values(EngineName).map((engine) => (
                      <MenuItem
                        key={engine}
                        value={engine}
                        disabled={!isEngineSupported(engine)}
                      >
                        {ENGINE_LABELS[engine].full}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Slider
                label="Bot Elo rating"
                value={engineElo}
                setValue={setEngineElo}
                min={1320}
                max={3190}
                step={10}
                marksFilter={374}
              />
            </>
          )}

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  color="default"
                  checked={playerColor === Color.White}
                  onChange={(e) => {
                    setPlayerColor(
                      e.target.checked ? Color.White : Color.Black
                    );
                  }}
                />
              }
              label={
                playerColor === Color.White
                  ? "You play as White"
                  : "You play as Black"
              }
            />
          </FormGroup>

          <FormControl fullWidth>
            <TextField
              label="Optional starting position (FEN or PGN)"
              variant="outlined"
              multiline
              value={startingPositionInput}
              onChange={(e) => setStartingPositionInput(e.target.value)}
            />
          </FormControl>

          {parsingError && (
            <FormControl fullWidth>
              <Typography color="salmon" textAlign="center" marginTop={1}>
                {parsingError}
              </Typography>
            </FormControl>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ m: 2 }}>
        <Button
          variant="outlined"
          sx={{ marginRight: 2 }}
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={handleGameStart}>
          Start game
        </Button>
      </DialogActions>
    </Dialog>
  );
}
