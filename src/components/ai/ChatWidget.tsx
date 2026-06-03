/**
 * ChatWidget - 通用流式聊天浮动 widget
 * 由 BrandAdvisor 注入 provider；支持历史持久化、流式输出、引用源
 */
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  BotMessageSquare,
  Send,
  Trash2,
  Sparkles,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  type ChatProvider,
  type ChatMessage,
  type ChatChunk,
} from '@/services/aiProvider';
import { brand } from '@/config';
import { logEvent } from '@/lib/observability';

interface Source {
  id: string;
  title: string;
  url?: string;
}

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  pending?: boolean;
}

interface Props {
  provider: ChatProvider;
  /** localStorage key 后缀（按 brand+provider 隔离） */
  historyKey?: string;
  /** 触发按钮的位置 className */
  triggerClassName?: string;
  /** 默认欢迎消息 */
  initialMessage?: string;
  /** 是否默认打开（用于嵌入页面） */
  defaultOpen?: boolean;
}

const MAX_HISTORY = 50;

function loadHistory(key: string): UIMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(key: string, msgs: UIMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    const slim = msgs.filter((m) => !m.pending).slice(-MAX_HISTORY);
    localStorage.setItem(key, JSON.stringify(slim));
  } catch {
    /* noop */
  }
}

export default function ChatWidget({
  provider,
  historyKey,
  triggerClassName,
  initialMessage,
  defaultOpen = false,
}: Props) {
  const key = historyKey ?? `miaoda-chat-history:${brand.id}:${provider.id}`;
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<UIMessage[]>(() => {
    const stored = loadHistory(key);
    if (stored.length > 0) return stored;
    return [
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: initialMessage ?? `你好！我是 ${provider.name}。${provider.description}`,
      },
    ];
  });
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  // 切换 provider 时刷新欢迎消息（不读 history，避免上下文错乱）
  useEffect(() => {
    setMessages((prev) => {
      const isStillSame = prev.length > 0 && prev[0].content.includes(provider.name);
      if (isStillSame) return prev;
      return [
        {
          id: `init-${Date.now()}`,
          role: 'assistant',
          content: initialMessage ?? `你好！我是 ${provider.name}。${provider.description}`,
        },
      ];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.id]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || pending) return;

    logEvent('chat.send', { brand: brand.id, provider: provider.id });

    const userMsg: UIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };
    const assistantMsg: UIMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      pending: true,
      sources: [],
    };
    const next = [...messages, userMsg, assistantMsg];
    setMessages(next);
    setInput('');
    setPending(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const apiMessages: ChatMessage[] = next
      .filter((m) => !m.pending)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      await provider.streamChat(
        apiMessages,
        (chunk: ChatChunk) => {
          if (chunk.type === 'token' && chunk.content) {
            setMessages((cur) => {
              const copy = [...cur];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = {
                ...last,
                content: last.content + (chunk.content ?? ''),
              };
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
                  content: `（${provider.name} 不可用：${chunk.error ?? '未知错误'}）`,
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
      setMessages((cur) => {
        const copy = [...cur];
        const last = copy[copy.length - 1];
        if (last) copy[copy.length - 1] = { ...last, pending: false };
        saveHistory(key, copy);
        return copy;
      });
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: initialMessage ?? `你好！我是 ${provider.name}。${provider.description}`,
      },
    ]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        /* noop */
      }
    }
  };

  return (
    <>
      <Button
        className={
          triggerClassName ??
          'fixed bottom-6 right-6 z-40 rounded-full size-14 shadow-lg gap-2'
        }
        onClick={() => setOpen(true)}
        aria-label="open chat"
      >
        <BotMessageSquare className="size-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <SheetHeader className="border-b px-4 py-3 flex-row items-center justify-between">
            <SheetTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              {provider.name}
              <Badge variant="outline" className="text-[10px] font-normal">
                {brand.name}
              </Badge>
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              aria-label="clear history"
            >
              <Trash2 className="size-4" />
            </Button>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {m.content || (m.role === 'assistant' && pending ? '…' : '')}
                  </div>
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

          <div className="border-t p-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`询问 ${provider.name}...`}
              disabled={pending}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={pending || !input.trim()}
              aria-label="send"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>

          {!provider.isConfigured() && (
            <Card className="m-3 border-amber-300 bg-amber-50/50 dark:bg-amber-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{provider.name} 未配置</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                请在「我的」页面填写 API 凭据，或切换到其他 provider。
              </CardContent>
            </Card>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
