"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatBubble } from './chat-bubble';
import { aiConversation } from '@/ai/flows/ai-conversation';
import { ThemeToggle } from '@/components/theme-toggle';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));

      const response = await aiConversation({
        message: userMessage,
        history: history
      });

      setMessages((prev) => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setMessages((prev) => [...prev, { 
        role: 'model', 
        content: "Lo siento, hubo un problema al procesar tu mensaje. ¿Podrías intentarlo de nuevo?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full gap-4 p-2 sm:p-4">
      {/* Header */}
      <Card className="flex items-center justify-between p-4 border-none shadow-md bg-card/80 backdrop-blur-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BrainCircuit className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary tracking-tight">Chatbot AI</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Asistente Inteligente Activo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearChat} 
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Borrar conversación"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col relative overflow-hidden border-none shadow-lg bg-card/50 backdrop-blur-sm transition-colors">
        <ScrollArea ref={scrollRef} className="flex-1 chat-scroll-area">
          {messages.length === 0 ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-6">
                <BrainCircuit className="h-8 w-8 text-primary/40" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Bienvenido a Chatbot</h2>
              <p className="text-muted-foreground max-w-sm">
                Tu asistente inteligente está listo para ayudarte. 
                Pregúntame cualquier cosa o cuéntame qué tienes en mente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-md">
                {[
                  "¿Cómo puedo mejorar mi productividad?",
                  "Ayúdame a planificar mi semana",
                  "Explícame qué es la inteligencia emocional",
                  "Dame consejos para dormir mejor"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="text-sm p-3 rounded-xl border border-primary/10 bg-card hover:bg-primary/5 hover:border-primary/20 transition-all text-left text-muted-foreground hover:text-primary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex gap-3 px-4 py-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-primary/20 shrink-0" />
                  <div className="flex flex-col gap-2 w-full max-w-[60%]">
                    <div className="h-4 bg-primary/10 rounded w-1/2" />
                    <div className="h-10 bg-primary/5 rounded w-full" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-border/50 transition-colors">
          <form onSubmit={handleSubmit} className="flex gap-2 relative items-end">
            <div className="relative flex-1 group">
              <Input
                placeholder="Escribe un mensaje..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 min-h-[48px] pr-12 bg-background border-none focus-visible:ring-2 focus-visible:ring-accent shadow-inner rounded-2xl transition-colors"
                disabled={isLoading}
              />
              <div className="absolute right-3 bottom-2.5 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
                Presiona Enter para enviar
              </div>
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-3 tracking-wide">
            Chatbot AI puede cometer errores. Considera verificar la información importante.
          </p>
        </div>
      </Card>
    </div>
  );
}
