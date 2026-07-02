'use client';

import { useState } from 'react';
import {
  Bot,
  User,
  Wand2,
  ShieldCheck,
  WifiOff,
  Loader2,
  Activity,
  ScrollText,
  ChevronDown,
  ChevronUp,
  Terminal,
  Wrench,
  Sparkles,
  Layout,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { conversationalAiAssistant } from '@/ai/client-stubs';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const ChatMessage = ({
  role,
  children,
  internalLog,
  actions,
}: {
  role: 'user' | 'bot';
  children: React.ReactNode;
  internalLog?: string;
  actions?: string[];
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300',
        role === 'user' ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'flex items-start gap-4',
          role === 'user' ? 'justify-end flex-row-reverse' : ''
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all shadow-lg',
            role === 'bot'
              ? 'bg-primary/10 border-primary/20 text-primary group-hover:bg-primary/20'
              : 'bg-secondary border-border text-muted-foreground'
          )}
        >
          {role === 'bot' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
        </div>

        <div
          className={cn(
            'relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xl',
            role === 'bot'
              ? 'bg-card/40 border border-white/5 backdrop-blur-md'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {role === 'bot' && (
            <div className="absolute -top-2 -left-2">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            </div>
          )}
          <div className="whitespace-pre-wrap">{children}</div>

          {actions && actions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
              {actions.map((action) => (
                <Badge
                  key={action}
                  variant="outline"
                  className="text-[9px] font-bold uppercase tracking-widest bg-accent/10 border-accent/20 text-accent gap-1.5 py-0.5"
                >
                  <Wrench className="h-2.5 w-2.5" /> {action}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {role === 'bot' && internalLog && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[85%] ml-14">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 hover:text-accent p-0 gap-2 transition-colors"
            >
              <Activity className={cn('h-3 w-3', isOpen ? 'text-accent' : '')} />
              {isOpen ? 'TERMINATE TRACE VIEW' : 'INSPECT RESONANCE PATH'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 overflow-hidden">
            <div className="rounded-xl border border-white/5 bg-black/40 p-3 font-code text-[10px] text-muted-foreground/80 leading-relaxed shadow-inner">
              <div className="flex items-center gap-2 mb-2 text-accent font-black uppercase tracking-tighter opacity-80">
                <Layout className="h-3 w-3" />
                SYSTEM_ORCHESTRATION_CORE_v1.0
              </div>
              <div className="whitespace-pre-wrap opacity-60 border-l border-accent/20 pl-3">
                {internalLog}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export function AiPanel({ isSystemOffline = false }: { isSystemOffline?: boolean }) {
  const [messages, setMessages] = useState<
    { role: 'user' | 'bot'; content: string; internalLog?: string; actions?: string[] }[]
  >([
    {
      role: 'bot',
      content:
        'SYSTEM ESTABLISHED: Era-2 P9 Swarm Orchestrator Active.\n\n我已完成全棧 Layer A-N 的深度掃描，並鎖定了專案語義奇點。當前環境監測狀態為 1.00 Resonance Stability。您可以下達任何架構維護或合成指令。',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsSending(true);

    try {
      const response = await conversationalAiAssistant({
        query: userMsg,
        isOffline: isSystemOffline,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: response.answer,
          internalLog: response.internalLog,
          actions: response.actionsTaken,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: `P9 CRITICAL FAULT: ${error.message}`,
          internalLog: '[SYSTEM_FAILURE] Swarm synchronization lost at Singularity Gate.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-80 border-l border-white/5 bg-card/10 flex flex-col h-full overflow-hidden">
      <div className="flex h-14 items-center justify-between px-4 border-b border-white/5 bg-card/20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#52E0B0]"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
            Orchestrator Core
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-bold bg-accent/5 text-accent border-accent/20 h-5 px-2"
        >
          SINGULARITY
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-8 pb-10">
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} internalLog={m.internalLog} actions={m.actions}>
              {m.content}
            </ChatMessage>
          ))}
          {isSending && (
            <div className="flex items-start gap-4 animate-pulse">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 border border-primary/10">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-[11px] bg-secondary/30 text-muted-foreground italic leading-relaxed">
                Agent 正在掃描專案拓撲並執行 P9 合成路徑...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-5 bg-card/30 border-t border-white/5 shrink-0">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
          <Textarea
            placeholder="下達專案監測指令或定義架構目標..."
            className="relative pr-20 resize-none text-[13px] bg-background/80 border-white/10 focus:border-accent/40 min-h-[100px] rounded-2xl py-3 px-4 leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="sm"
            className="absolute bottom-3 right-3 h-8 px-4 text-[10px] font-black uppercase tracking-widest bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl transition-all hover:scale-105 active:scale-95"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'EXECUTE'}
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-white/5"></div>
          <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">
            Era-2 P9 | Symbiotic OS
          </span>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>
      </div>
    </div>
  );
}
