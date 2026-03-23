import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetOpenaiConversationQueryKey } from "@workspace/api-client-react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export function useChatStream(conversationId: number | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Initialize from cache if available
  const initialDataLoaded = useRef(false);

  const initMessages = useCallback((initialMessages: any[]) => {
    if (!initialDataLoaded.current) {
      setMessages(initialMessages);
      initialDataLoaded.current = true;
    }
  }, []);

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return;

    const userMessage: Message = {
      id: Date.now(), // Temp ID
      role: "user",
      content,
    };

    const assistantMessagePlaceholder: Message = {
      id: Date.now() + 1, // Temp ID
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessagePlaceholder]);
    setIsStreaming(true);
    setError(null);

    try {
      const response = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantContent = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (!dataStr || dataStr === "[DONE]") continue;
              
              try {
                const data = JSON.parse(dataStr);
                if (data.done) {
                  done = true;
                  break;
                }
                if (data.content) {
                  assistantContent += data.content;
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    if (newMsgs[lastIdx].role === "assistant") {
                      newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: assistantContent };
                    }
                    return newMsgs;
                  });
                }
              } catch (e) {
                console.error("Error parsing SSE chunk:", e, dataStr);
              }
            }
          }
        }
      }

      // Invalidate the conversation query to get the real IDs and updated state from DB
      queryClient.invalidateQueries({
        queryKey: getGetOpenaiConversationQueryKey(conversationId),
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Remove the placeholder on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    messages,
    initMessages,
    sendMessage,
    isStreaming,
    error,
  };
}
