import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useChatStream } from "@/hooks/use-chat-stream";
import { useListOpenaiConversations, useCreateOpenaiConversation } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

export default function AIAdvisor() {
  const [input, setInput] = useState("");
  const { data: conversations, isLoading: loadingConvos } = useListOpenaiConversations();
  const createConvo = useCreateOpenaiConversation();
  
  // For simplicity in this demo, use the first conversation or create one
  const [activeConvoId, setActiveConvoId] = useState<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvoId) {
      setActiveConvoId(conversations[0].id);
    } else if (conversations?.length === 0 && !activeConvoId && !createConvo.isPending) {
      createConvo.mutateAsync({ data: { title: "Financial Advice" } }).then(res => {
        setActiveConvoId(res.id);
      });
    }
  }, [conversations, activeConvoId]);

  const { messages, sendMessage, isStreaming, error } = useChatStream(activeConvoId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground">Financial Advisor AI</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Online
              </p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[url('/images/ai-bg.png')] bg-cover bg-center bg-fixed bg-no-repeat relative">
           <div className="absolute inset-0 bg-background/90 mix-blend-multiply pointer-events-none" />
           <div className="relative z-10 space-y-6">
            
            {messages.length === 0 && !isStreaming && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 my-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">How can I help you manage your wealth today?</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">Ask me about your budget, anomaly detection, or general investment strategies.</p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`px-5 py-3.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/10' 
                      : 'bg-card border border-border/80 text-foreground rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content ? msg.content : (
                      <div className="flex gap-1.5 items-center h-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur z-10">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your financial advisor..."
              className="w-full bg-card border-2 border-border/80 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl pl-5 pr-14 py-4 text-sm transition-all"
              disabled={isStreaming}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          {error && <p className="text-xs text-destructive mt-2 ml-2">{error}</p>}
        </div>
      </div>
    </Layout>
  );
}
