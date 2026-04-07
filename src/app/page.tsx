import { ChatInterface } from "@/components/chat/chat-interface";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-0 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-accent rounded-full blur-[100px]" />
        <div className="absolute bottom-[0%] left-[20%] w-[20%] h-[20%] bg-primary/50 rounded-full blur-[80px]" />
      </div>
      
      <div className="relative z-10 w-full h-screen sm:h-[90vh]">
        <ChatInterface />
      </div>
    </main>
  );
}