/**
 * Campus brand - RAG 问答面板（流式 + 引用源）
 */
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, X, Sparkles, BookOpen } from 'lucide-react';
import { streamCampusQA, type CampusQAChunk } from '@/services/campusRAG';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: string; title: string; url?: string }>;
}

export default function CampusQAPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '你好！我是校园智能助手。可以问我关于选课、办事流程、宿舍、就业等问题，我会基于校园知识库回答。',
    },
  ]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || pending) return;

    const hist = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [
      ...m,
      { role: 'user', content: q },
      { role: 'assistant', content: '', sources: [] },
    ]);
    setInput('');
    setPending(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await streamCampusQA(
        { question: q, history: hist },
        (chunk: CampusQAChunk) => {
          if (chunk.type === 'token' && chunk.content) {
            setMessages((cur) => {
              const copy = [...cur];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = { ...last, content: last.content + chunk.content };
              return copy;
            });
          } else if (chunk.type === 'source' && chunk.source) {
            setMessages((cur) => {
              const copy = [...cur];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = {
                ...last,
                sources: [...(last.sources ?? []), chunk.source!],
              };
              return copy;
            });
          } else if (chunk.type === 'error') {
            setMessages((cur) => {
              const copy = [...cur];
              const last = copy[copy.length - 1];
              if (!last.content) {
                copy[copy.length - 1] = {
                  ...last,
                  content: `（RAG 服务不可用：${chunk.error}。请检查 VITE_CAMPUS_API_BASE）`,
                };
              }
              return copy;
            });
          }
        },
        ctrl.signal,
      );
    } finally {
      setPending(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-[360px] max-w-[calc(100vw-2rem)] z-50 animate-in fade-in slide-in-from-bottom-5">
      <Card className="shadow-2xl border-2 max-h-[70vh] flex flex-col">
        <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            校园 AI 问答
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div>{m.content || (m.role === 'assistant' && pending ? '…' : '')}</div>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-current/10 space-y-1">
                      {m.sources.map((s) => (
                        <Badge
                          key={s.id}
                          variant="outline"
                          className="text-[10px] bg-white/50 gap-1"
                        >
                          <BookOpen className="size-2.5" />
                          {s.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-2 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="例如：怎么补办校园卡？"
              disabled={pending}
              className="h-9"
            />
            <Button size="icon" onClick={handleSend} disabled={pending || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
