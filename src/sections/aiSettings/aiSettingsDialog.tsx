import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid2 as Grid,
  Alert,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useAtom } from "jotai";
import {
  aiProviderAtom,
  aiOpenAIKeyAtom,
  aiAnthropicKeyAtom,
  aiDeepSeekKeyAtom,
  aiModelAtom,
} from "../analysis/states";
import { useState } from "react";
import { createAIService } from "@/lib/ai";
import { AIProvider } from "@/types/ai";

const PROVIDER_MODELS: Record<AIProvider, { value: string; label: string }[]> =
  {
    [AIProvider.OpenAI]: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
      { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
      { value: "gpt-4.1", label: "GPT-4.1" },
      { value: "gpt-5", label: "GPT-5" },
      { value: "gpt-5.1", label: "GPT-5.1" },
      { value: "gpt-5.2", label: "GPT-5.2" },
    ],
    [AIProvider.Anthropic]: [
      { value: "claude-haiku-4-5-20251001", label: "Claude 4.5 Haiku" },
      { value: "claude-sonnet-4-5-20250929", label: "Claude 4.5 Sonnet" },
      { value: "claude-opus-4-6", label: "Claude Opus" },
    ],
    [AIProvider.DeepSeek]: [{ value: "deepseek-chat", label: "DeepSeek Chat" }],
  };

interface Props {
  open: boolean;
  onClose: () => void;
}

const providerLabels: Record<AIProvider, string> = {
  [AIProvider.OpenAI]: "OpenAI",
  [AIProvider.Anthropic]: "Anthropic",
  [AIProvider.DeepSeek]: "DeepSeek",
};

const providerKeyInfo: Record<
  AIProvider,
  { label: string; placeholder: string; url: string; urlLabel: string }
> = {
  [AIProvider.OpenAI]: {
    label: "OpenAI API Key",
    placeholder: "sk-...",
    url: "https://platform.openai.com/api-keys",
    urlLabel: "Get one from OpenAI",
  },
  [AIProvider.Anthropic]: {
    label: "Anthropic API Key",
    placeholder: "sk-ant-...",
    url: "https://console.anthropic.com/settings/keys",
    urlLabel: "Get one from Anthropic",
  },
  [AIProvider.DeepSeek]: {
    label: "DeepSeek API Key",
    placeholder: "sk-...",
    url: "https://platform.deepseek.com/api_keys",
    urlLabel: "Get one from DeepSeek",
  },
};

export default function AISettingsDialog({ open, onClose }: Props) {
  const [provider, setProvider] = useAtom(aiProviderAtom);
  const [model, setModel] = useAtom(aiModelAtom);
  const [openAIKey, setOpenAIKey] = useAtom(aiOpenAIKeyAtom);
  const [anthropicKey, setAnthropicKey] = useAtom(aiAnthropicKeyAtom);
  const [deepSeekKey, setDeepSeekKey] = useAtom(aiDeepSeekKeyAtom);

  const keys: Record<AIProvider, [string, (v: string) => void]> = {
    [AIProvider.OpenAI]: [openAIKey, setOpenAIKey],
    [AIProvider.Anthropic]: [anthropicKey, setAnthropicKey],
    [AIProvider.DeepSeek]: [deepSeekKey, setDeepSeekKey],
  };
  const [currentKey, setCurrentKey] = keys[provider];

  const [tempKey, setTempKey] = useState(currentKey);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>();
  const [validationSuccess, setValidationSuccess] = useState(false);

  const keyInfo = providerKeyInfo[provider];

  const models = PROVIDER_MODELS[provider];
  const selectedModel =
    model && models.some((m) => m.value === model) ? model : models[0].value;

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(PROVIDER_MODELS[newProvider][0].value);
    setValidationError(undefined);
    setValidationSuccess(false);
    const [key] = keys[newProvider];
    setTempKey(key);
  };

  const handleSave = async () => {
    if (!tempKey.trim()) {
      setCurrentKey("");
      onClose();
      return;
    }

    setValidating(true);
    setValidationError(undefined);
    setValidationSuccess(false);

    try {
      const service = createAIService(provider);
      const isValid = await service.validateApiKey(tempKey.trim());

      if (isValid) {
        setCurrentKey(tempKey.trim());
        setValidationSuccess(true);
        setTimeout(() => {
          onClose();
          setValidationSuccess(false);
        }, 1000);
      } else {
        setValidationError("Invalid API key. Please check and try again.");
      }
    } catch {
      setValidationError(
        "Unable to validate API key. Please check your connection."
      );
    } finally {
      setValidating(false);
    }
  };

  const handleClose = () => {
    setTempKey(currentKey);
    setValidationError(undefined);
    setValidationSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle variant="h5" sx={{ paddingBottom: 1 }}>
        AI Analysis Settings
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} paddingTop={2}>
          <Grid size={12}>
            <Typography variant="body2">
              Get AI-powered insights about your games. Your API key is stored
              locally in your browser and never sent to Chesskit servers.
            </Typography>
          </Grid>

          <Grid size={12}>
            <FormControl fullWidth>
              <InputLabel id="ai-provider-label">AI Provider</InputLabel>
              <Select
                labelId="ai-provider-label"
                value={provider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as AIProvider)
                }
                input={<OutlinedInput label="AI Provider" />}
              >
                {Object.values(AIProvider).map((p) => (
                  <MenuItem key={p} value={p}>
                    {providerLabels[p]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <FormControl fullWidth>
              <InputLabel id="ai-model-label">Model</InputLabel>
              <Select
                labelId="ai-model-label"
                value={selectedModel}
                onChange={(e) => setModel(e.target.value)}
                input={<OutlinedInput label="Model" />}
              >
                {models.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label={keyInfo.label}
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder={keyInfo.placeholder}
              helperText={`Enter your ${providerLabels[provider]} API key to enable AI analysis`}
              error={!!validationError}
            />
          </Grid>

          {validationError && (
            <Grid size={12}>
              <Alert severity="error">{validationError}</Alert>
            </Grid>
          )}

          {validationSuccess && (
            <Grid size={12}>
              <Alert severity="success">API key validated successfully!</Alert>
            </Grid>
          )}

          <Grid size={12}>
            <Typography variant="caption" color="text.secondary">
              {"Don't have an API key? "}
              <Link
                href={keyInfo.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {keyInfo.urlLabel}
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ m: 1 }}>
        <Button variant="outlined" onClick={handleClose}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={validating}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
