
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";
import { Sparkles, User } from "lucide-react";

interface ChatBubbleProps {
  role: 'user' | 'model';
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "flex w-full gap-3 px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
        isUser ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      
      <div className={cn(
        "flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm transition-colors",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : "bg-card text-foreground rounded-tl-none border border-border"
        )}>
          <MarkdownRenderer content={content} />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">
          {isUser ? 'Tú' : 'MindFlow'}
        </span>
      </div>
    </div>
  );
}
