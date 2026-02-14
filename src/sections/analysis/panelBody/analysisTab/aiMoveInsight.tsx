import { Paper, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { currentPositionAtom, aiMoveAnalysesAtom } from "../../states";
import Markdown from "react-markdown";

export default function AIMoveInsight() {
  const position = useAtomValue(currentPositionAtom);
  const moveAnalyses = useAtomValue(aiMoveAnalysesAtom);

  const moveIndex =
    position.currentMoveIdx !== undefined ? position.currentMoveIdx - 1 : -1;
  const analysis = moveIndex >= 0 ? moveAnalyses[moveIndex] : undefined;

  if (!analysis) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        padding: 1.5,
        backgroundColor: "action.hover",
        borderRadius: 1,
        width: "100%",
        "& p": { margin: 0 },
        "& p + p": { marginTop: 0.5 },
      }}
    >
      <Typography variant="body2" component="div" sx={{ fontSize: "0.85rem" }}>
        <Markdown>{analysis}</Markdown>
      </Typography>
    </Paper>
  );
}
