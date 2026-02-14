import { Fab } from "@mui/material";
import { useState } from "react";
import AISettingsDialog from "./aiSettingsDialog";
import { Icon } from "@iconify/react";

export default function AISettingsButton() {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Fab
        title="AI settings"
        color="secondary"
        size="small"
        sx={{
          top: "auto",
          right: 16,
          bottom: 64,
          left: "auto",
          position: "fixed",
        }}
        onClick={() => setOpenDialog(true)}
      >
        <Icon icon="mdi:brain" height={20} />
      </Fab>

      <AISettingsDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
