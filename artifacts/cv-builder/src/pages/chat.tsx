import React, { useState, useEffect, useRef } from 'react';
import { 
  useListOpenaiConversations, 
  useCreateOpenaiConversation, 
  useListOpenaiMessages,
  getListOpenaiConversationsQueryKey,
  getListOpenaiMessagesQueryKey,
  OpenaiConversation
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSSE } from '@/hooks/use-sse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MessageSquare, Plus, User, Bot, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Chat() {
  const queryClient = useQueryClient();
  const { data: conversations, isLoading: isConversationsLoading } = useListOpenaiConversations({
    query: { queryKey: getListOpenaiConversationsQueryKey() }
  });

  const [activeConvId, setActiveConvId] = useState<number | null>(null);

  // Set first conversation as active initially
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const createMutation = useCreateOpenaiConversation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        setActiveConvId(data.id);
      }
    }
  });

  const handleNewChat = () => {
    createMutation.mutate({ data: { title: "New Career Session" } });
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar for chat history */}
      <div className="w-80 border-r flex flex-col bg-card flex-shrink-0">
        <div className="p-4 border-b flex-none flex items-center justify-between">
          <h2 className="font-bold tracking-tight">Sessions</h2>
          <Button 
            size="icon" 
            variant="outline" 
            className="h-8 w-8 rounded-sm"
            onClick={handleNewChat}
            disabled={createMutation.isPending}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isConversationsLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : conversations?.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No sessions yet.</div>
            ) : (
              conversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-sm text-sm transition-colors group flex items-start gap-3",
                    activeConvId === conv.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <MessageSquare className={cn("w-4 h-4 mt-0.5", activeConvId === conv.id ? "text-primary-foreground/70" : "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conv.title}</p>
                    <p className={cn("text-xs truncate", activeConvId === conv.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {format(new Date(conv.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConvId ? (
          <ChatWorkspace conversationId={activeConvId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <Bot className="w-12 h-12 mb-4 opacity-50" />
            <p>Select a session or create a new one to chat with the AI Career Coach.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatWorkspace({ conversationId }: { conversationId: number }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, isLoading } = useListOpenaiMessages(conversationId, {
    query: { enabled: !!conversationId, queryKey: getListOpenaiMessagesQueryKey(conversationId) }
  });

  const { stream, isStreaming } = useSSE();
  const [streamingContent, setStreamingContent] = useState('');

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input;
    setInput('');
    setStreamingContent('');

    // Optimistically update cache to show user message immediately
    queryClient.setQueryData(getListOpenaiMessagesQueryKey(conversationId), (old: any) => {
      return [...(old || []), { id: Date.now(), role: 'user', content: userMessage, createdAt: new Date().toISOString() }];
    });

    await stream(
      `/api/openai/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage })
      },
      (chunk) => {
        setStreamingContent(prev => prev + chunk);
      },
      () => {
        setStreamingContent('');
        queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(conversationId) });
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="p-4 border-b flex-none bg-background shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight">AI Career Coach</h2>
            <p className="text-xs text-muted-foreground">Ask for interview prep, resume reviews, or career advice.</p>
          </div>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-muted/10"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4 opacity-50">
            <Bot className="w-12 h-12" />
            <p>I'm your AI career coach. I have access to your profile, documents, and application history. How can I help you today?</p>
          </div>
        ) : (
          messages?.map((msg) => (
            <div key={msg.id} className={cn("flex gap-4 max-w-3xl", msg.role === 'user' ? "ml-auto" : "")}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-sm bg-primary flex-shrink-0 flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className={cn(
                "p-4 rounded-sm prose dark:prose-invert prose-sm max-w-none text-sm",
                msg.role === 'user' 
                  ? "bg-muted text-foreground" 
                  : "bg-card border shadow-sm"
              )}>
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-sm bg-sidebar flex-shrink-0 flex items-center justify-center mt-1">
                  <User className="w-4 h-4 text-sidebar-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-4 max-w-3xl">
             <div className="w-8 h-8 rounded-sm bg-primary flex-shrink-0 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="p-4 rounded-sm bg-card border shadow-sm prose dark:prose-invert prose-sm max-w-none text-sm w-full">
                {streamingContent.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                ))}
                <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-1 align-middle"></span>
              </div>
          </div>
        )}
        {isStreaming && !streamingContent && (
          <div className="flex gap-4 max-w-3xl">
            <div className="w-8 h-8 rounded-sm bg-primary flex-shrink-0 flex items-center justify-center mt-1">
               <Bot className="w-4 h-4 text-primary-foreground" />
             </div>
             <div className="p-4 rounded-sm bg-card border shadow-sm flex items-center">
               <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
             </div>
         </div>
        )}
      </div>

      <div className="p-4 bg-background border-t">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="pr-12 py-6 rounded-sm bg-muted/50 border-transparent focus-visible:border-primary focus-visible:ring-1"
            disabled={isStreaming}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 h-8 w-8 rounded-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
