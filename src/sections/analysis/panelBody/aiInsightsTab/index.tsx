import {
  Grid2 as Grid,
  Grid2Props as GridProps,
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
  TextField,
  IconButton,
} from "@mui/material";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  aiChatMessagesAtom,
  aiChatLoadingAtom,
  aiErrorAtom,
  aiGameContextAtom,
  aiContextBuildingProgressAtom,
  aiProviderAtom,
  aiOpenAIKeyAtom,
  aiAnthropicKeyAtom,
  aiDeepSeekKeyAtom,
  aiModelAtom,
} from "../../states";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { createAIService } from "@/lib/ai";
import { AIAnalysisError, AIChatMessage, AIProvider } from "@/types/ai";
import { CHAT_SYSTEM_PROMPT_TEMPLATE } from "@/lib/ai/prompt";
import Markdown from "react-markdown";

export default function AIInsightsTab(props: GridProps) {
  const chatMessages = useAtomValue(aiChatMessagesAtom);
  const chatLoading = useAtomValue(aiChatLoadingAtom);
  const error = useAtomValue(aiErrorAtom);
  const aiGameContext = useAtomValue(aiGameContextAtom);
  const contextProgress = useAtomValue(aiContextBuildingProgressAtom);

  const isBuilding = contextProgress > 0 && contextProgress < 99;

  if (isBuilding) {
    return (
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        minHeight="12rem"
        {...props}
        sx={props.hidden ? { display: "none" } : props.sx}
        size={12}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Box position="relative" display="inline-flex">
            <CircularProgress
              variant="determinate"
              value={contextProgress}
              size={48}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                component="div"
                color="text.secondary"
              >
                {Math.round(contextProgress)}%
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Building AI context...
          </Typography>
        </Box>
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        padding={2}
        {...props}
        sx={props.hidden ? { display: "none" } : props.sx}
        size={12}
      >
        <Alert severity="error" sx={{ maxWidth: "40rem" }}>
          <Typography variant="body2" fontWeight="bold">
            {error.type === "invalid_key" && "Invalid API Key"}
            {error.type === "rate_limit" && "Rate Limit Exceeded"}
            {error.type === "network" && "Network Error"}
            {error.type === "unknown" && "Analysis Failed"}
          </Typography>
          <Typography variant="body2">{error.message}</Typography>
        </Alert>
      </Grid>
    );
  }

  const visibleMessages = chatMessages.filter((m) => m.role !== "system");
  if (!aiGameContext && visibleMessages.length === 0) return null;

  return (
    <Grid
      container
      direction="column"
      wrap="nowrap"
      {...props}
      sx={{
        ...(props.hidden ? { display: "none" } : props.sx),
        flex: 1,
        minHeight: { xs: 0, lg: "20rem" },
        overflow: "hidden",
      }}
      size={12}
    >
      <MessageList messages={visibleMessages} loading={chatLoading} />
      <ChatInput />
    </Grid>
  );
}

function MessageList({
  messages,
  loading,
}: {
  messages: AIChatMessage[];
  loading: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <Box
      ref={listRef}
      sx={{
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "thin",
        padding: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {messages.map((message, idx) => (
        <ChatBubble key={idx} message={message} />
      ))}
      {loading && (
        <Box display="flex" alignItems="center" gap={1} paddingLeft={1}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Thinking...
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function ChatBubble({ message }: { message: AIChatMessage }) {
  const isUser = message.role === "user";

  return (
    <Box
      display="flex"
      justifyContent={isUser ? "flex-end" : "flex-start"}
      width="100%"
    >
      <Paper
        elevation={1}
        sx={{
          padding: 1.5,
          maxWidth: "85%",
          backgroundColor: isUser ? "primary.main" : "action.hover",
          color: isUser ? "primary.contrastText" : "text.primary",
          borderRadius: 2,
          "& p": { margin: 0 },
          "& p + p": { marginTop: 1 },
          "& ul, & ol": { margin: 0, paddingLeft: 2.5 },
          "& code": {
            backgroundColor: isUser
              ? "rgba(255,255,255,0.15)"
              : "action.selected",
            padding: "1px 4px",
            borderRadius: 1,
            fontSize: "0.85em",
          },
        }}
      >
        {isUser ? (
          <Typography variant="body2">{message.content}</Typography>
        ) : (
          <Typography variant="body2" component="div">
            <Markdown>{message.content}</Markdown>
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

function ChatInput() {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useAtom(aiChatMessagesAtom);
  const [chatLoading, setChatLoading] = useAtom(aiChatLoadingAtom);
  const setError = useSetAtom(aiErrorAtom);
  const aiGameContext = useAtomValue(aiGameContextAtom);
  const provider = useAtomValue(aiProviderAtom);
  const model = useAtomValue(aiModelAtom);
  const openAIKey = useAtomValue(aiOpenAIKeyAtom);
  const anthropicKey = useAtomValue(aiAnthropicKeyAtom);
  const deepSeekKey = useAtomValue(aiDeepSeekKeyAtom);

  const keyMap: Record<AIProvider, string> = {
    [AIProvider.OpenAI]: openAIKey,
    [AIProvider.Anthropic]: anthropicKey,
    [AIProvider.DeepSeek]: deepSeekKey,
  };
  const apiKey = keyMap[provider];

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || chatLoading || !aiGameContext) return;

    setInput("");
    setError(undefined);

    const userMessage: AIChatMessage = { role: "user", content: trimmed };

    // Build full messages array including system message
    let allMessages: AIChatMessage[];
    if (chatMessages.length > 0 && chatMessages[0].role === "system") {
      allMessages = [...chatMessages, userMessage];
    } else {
      allMessages = [
        {
          role: "system",
          content: CHAT_SYSTEM_PROMPT_TEMPLATE(aiGameContext),
        },
        ...chatMessages,
        userMessage,
      ];
    }

    setChatMessages(allMessages);
    setChatLoading(true);

    try {
      const service = createAIService(provider, model || undefined);
      const response = await service.chat(allMessages, apiKey);
      setChatMessages([
        ...allMessages,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      const isAIError = error && typeof error === "object" && "type" in error;
      setError(
        isAIError
          ? (error as AIAnalysisError)
          : { type: "unknown", message: "Failed to get response" }
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      padding={1.5}
      borderTop={1}
      borderColor="divider"
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Ask about the game..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={chatLoading}
        multiline
        maxRows={3}
        sx={{
          "& .MuiOutlinedInput-root": {
            fontSize: "0.875rem",
          },
        }}
      />
      <IconButton
        onClick={handleSend}
        disabled={!input.trim() || chatLoading}
        color="primary"
        size="small"
      >
        <Icon icon="mdi:send" height={20} />
      </IconButton>
    </Box>
  );
}
