// AI职业顾问悬浮聊天组件
// 支持 Dify chat-messages（优先） / MiniMax 流式SSE（备选）
// 含对话历史 localStorage 持久化 + 里程碑完成后主动推送气泡
import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/db/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { BotMessageSquare, X, Send, Loader2, ChevronDown, Sparkles, Trash2 } from 'lucide-react';
import { createParser } from 'eventsource-parser';
import { toast } from 'sonner';

// ---- 类型 ----
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  pending?: boolean;
}

// ---- 常量 ----
const HISTORY_KEY = 'ai_chat_history';
const MAX_HISTORY = 50;

// ---- localStorage helpers ----
function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch { return []; }
}

function saveHistory(msgs: ChatMessage[]) {
  try {
    const toSave = msgs.filter((m) => !m.pending).slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

// ---- Dify config helper ----
function getDifyConfig(): { apiUrl: string; apiKey: string } | null {
  try {
    const raw = localStorage.getItem('dify_config');
    if (!raw) return null;
    const cfg = JSON.parse(raw) as { apiUrl?: string; apiKey?: string };
    if (cfg.apiUrl && cfg.apiKey) return { apiUrl: cfg.apiUrl.replace(/\/$/, ''), apiKey: cfg.apiKey };
  } catch { /* ignore */ }
  return null;
}

// ---- System prompt ----
function buildSystemPrompt(
  studentName: string, targetRole: string, major: string,
  currentMilestone: string, completedCount: number, totalMilestones: number, matchRate: number
): string {
  return `你是"职业路径导航器"内置的AI职业规划顾问，专为高职院校学生提供职业发展建议。

当前学生信息：
- 姓名：${studentName}
- 专业：${major}
- 目标岗位：${targetRole}
- 当前岗位匹配度：${matchRate}%
- 学习进度：已完成 ${completedCount}/${totalMilestones} 个里程碑
- 当前里程碑：${currentMilestone}

你的职责：
1. 回答学生关于职业规划、技能学习、证书考取的问题
2. 针对${targetRole}岗位给出具体、实用的建议
3. 解释课程选择和学习顺序的合理性
4. 鼓励学生并帮助其克服学习困难
5. 推荐相关学习资源、GitHub项目和1+X证书

回答风格：
- 简洁、实用，避免废话
- 使用条目/编号增强可读性
- 重点内容加粗（用**文字**格式）
- 结合学生的具体学习状态给出个性化建议
- 每次回答控制在300字以内`;
}

const QUICK_QUESTIONS = [
  '我现在该优先学什么技能？',
  '如何准备1+X证书考试？',
  '推荐哪些GitHub实训项目？',
  '我的学习进度正常吗？',
];

// ---- 组件 ----
const AIAdvisorWidget: React.FC = () => {
  const { student, careerPath, milestones, lastCompletedMilestoneTitle } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 已处理的推送 title，防止重复推送
  const lastPushedRef = useRef('');

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 打开时聚焦输入框 & 清除未读数
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnread(0);
    }
  }, [open]);

  // 持久化：每次 messages 变化时保存（非 pending）
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // 里程碑完成 → 主动推送气泡
  useEffect(() => {
    if (!lastCompletedMilestoneTitle) return;
    if (lastCompletedMilestoneTitle === lastPushedRef.current) return;
    lastPushedRef.current = lastCompletedMilestoneTitle;

    const nextMilestone = milestones.find((m) => m.status === 'current');
    const pushContent = `🎉 恭喜完成**${lastCompletedMilestoneTitle}**！\n\n下一步建议：\n1. **立即开始**「${nextMilestone?.title ?? '下一里程碑'}」，保持学习节奏\n2. 复习本阶段掌握的技能，查漏补缺\n3. 如有对应 1+X 证书，现在是准备的好时机\n\n继续加油，目标岗位越来越近了 💪`;

    const pushMsg: ChatMessage = {
      id: `push-${Date.now()}`,
      role: 'assistant',
      content: pushContent,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, pushMsg]);
    if (!open) setUnread((n) => n + 1);
  }, [lastCompletedMilestoneTitle, milestones, open]);

  const currentMilestone = milestones.find((m) => m.status === 'current');
  const completedCount = milestones.filter((m) => m.status === 'completed').length;

  // 构建 MiniMax messages 数组
  const buildMinimaxMessages = useCallback(
    (userText: string) => {
      const systemPrompt = buildSystemPrompt(
        student?.name ?? '同学', student?.target_role ?? '目标岗位',
        student?.major ?? '专业', currentMilestone?.title ?? '暂无',
        completedCount, milestones.length, 70
      );
      const history = messages
        .filter((m) => !m.pending)
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content, name: m.role === 'user' ? '学生' : 'AI顾问' }));
      return [
        { role: 'system', content: systemPrompt, name: 'AI顾问' },
        ...history,
        { role: 'user', content: userText, name: '学生' },
      ];
    },
    [messages, student, currentMilestone, completedCount, milestones.length]
  );

  // ---- 发送消息（Dify 优先，MiniMax 备用）----
  const sendMessage = useCallback(
    async (text: string) => {
      const userText = text.trim();
      if (!userText || streaming) return;

      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userText, timestamp: Date.now() };
      const pendingId = (Date.now() + 1).toString();
      const pendingMsg: ChatMessage = { id: pendingId, role: 'assistant', content: '', timestamp: Date.now(), pending: true };

      setMessages((prev) => [...prev, userMsg, pendingMsg]);
      setInput('');
      setStreaming(true);

      abortRef.current = new AbortController();
      const dify = getDifyConfig();

      try {
        // ======= Dify chat-messages（流式 SSE）=======
        if (dify) {
          const res = await fetch(`${dify.apiUrl}/chat-messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${dify.apiKey}`,
            },
            body: JSON.stringify({
              query: userText,
              inputs: {
                student_name: student?.name ?? '',
                target_role: student?.target_role ?? '',
                major: student?.major ?? '',
                current_milestone: currentMilestone?.title ?? '',
                progress: `${completedCount}/${milestones.length}`,
              },
              response_mode: 'streaming',
              user: student?.name ?? 'student',
              conversation_id: '',
            }),
            signal: abortRef.current.signal,
          });

          if (!res.ok || !res.body) throw new Error(`Dify HTTP ${res.status}`);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          const parser = createParser({
            onEvent: (event) => {
              if (!event.data || event.data === '[DONE]') return;
              try {
                const parsed = JSON.parse(event.data);
                // Dify streaming 事件：event=message 时有 answer 增量
                const delta: string = parsed.answer ?? parsed.delta ?? '';
                if (delta) {
                  setMessages((prev) =>
                    prev.map((m) => m.id === pendingId ? { ...m, content: m.content + delta, pending: true } : m)
                  );
                }
              } catch { /* skip */ }
            },
          });

          const pump = async (): Promise<void> => {
            const { done, value } = await reader.read();
            if (done) return;
            parser.feed(decoder.decode(value, { stream: true }));
            return pump();
          };
          await pump();

          setMessages((prev) => prev.map((m) => m.id === pendingId ? { ...m, pending: false } : m));

        } else {
          // ======= MiniMax 流式 SSE =======
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
          const msgPayload = buildMinimaxMessages(userText);

          const response = await fetch(`${supabaseUrl}/functions/v1/minimax-chat-stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseAnonKey}`,
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({ model: 'MiniMax-M2.5', messages: msgPayload, temperature: 0.8, max_completion_tokens: 1024 }),
            signal: abortRef.current.signal,
          });

          if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          const parser = createParser({
            onEvent: (event) => {
              if (!event.data || event.data === '[DONE]') return;
              try {
                const parsed = JSON.parse(event.data);
                const delta: string = parsed.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  setMessages((prev) =>
                    prev.map((m) => m.id === pendingId ? { ...m, content: m.content + delta, pending: true } : m)
                  );
                }
              } catch { /* skip */ }
            },
          });

          const read = async (): Promise<void> => {
            const { done, value } = await reader.read();
            if (done) return;
            parser.feed(decoder.decode(value, { stream: true }));
            return read();
          };
          await read();

          setMessages((prev) => prev.map((m) => m.id === pendingId ? { ...m, pending: false } : m));
        }

      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) => m.id === pendingId ? { ...m, content: m.content || '已停止生成', pending: false } : m)
          );
        } else {
          // 最终 fallback：MiniMax 非流式
          try {
            const { data, error } = await supabase.functions.invoke('minimax-chat', {
              body: { model: 'MiniMax-M2.5', messages: buildMinimaxMessages(userText), temperature: 0.8, max_completion_tokens: 1024 },
            });
            if (error) throw error;
            const content: string = data?.choices?.[0]?.message?.content ?? '抱歉，AI顾问暂时无法回应，请稍后重试。';
            setMessages((prev) => prev.map((m) => m.id === pendingId ? { ...m, content, pending: false } : m));
          } catch {
            setMessages((prev) =>
              prev.map((m) => m.id === pendingId ? { ...m, content: '网络错误，请稍后重试。', pending: false } : m)
            );
          }
        }
      } finally {
        setStreaming(false);
      }
    },
    [streaming, buildMinimaxMessages, student, currentMilestone, completedCount, milestones.length]
  );

  const handleStop = () => abortRef.current?.abort();

  const clearChat = () => {
    setMessages([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
    toast.success('对话已清空');
  };

  const dify = getDifyConfig();

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="打开AI职业顾问"
        className={cn(
          'fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full shadow-lg',
          'bg-primary flex items-center justify-center',
          'transition-transform hover:scale-110 active:scale-95',
          open && 'hidden'
        )}
      >
        <BotMessageSquare className="w-5 h-5 text-primary-foreground" />
        {/* 未读气泡 */}
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive border-2 border-background flex items-center justify-center px-0.5">
            <span className="text-[10px] font-bold text-white leading-none">{unread}</span>
          </span>
        ) : messages.length === 0 ? (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" />
        ) : null}
      </button>

      {/* 聊天抽屉 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-[calc(100%-2rem)] md:max-w-sm p-0 flex flex-col gap-0"
        >
          {/* 头部 */}
          <SheetHeader className="flex-row items-center justify-between px-4 py-3 border-b bg-primary shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold text-white text-left">AI职业顾问</SheetTitle>
                <p className="text-[10px] text-white/70">
                  {dify ? 'Dify · 已配置自定义服务' : 'MiniMax M2.5 · 智能规划助手'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white px-2 py-1 rounded"
                  title="清空对话"
                >
                  <Trash2 className="w-3 h-3" />
                  清空
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </SheetHeader>

          {/* 学生上下文标签 */}
          {student && (
            <div className="px-3 py-2 bg-accent/50 border-b flex items-center gap-1.5 flex-wrap shrink-0">
              <Badge variant="secondary" className="text-[10px] px-2 py-0">{student.name}</Badge>
              <Badge variant="secondary" className="text-[10px] px-2 py-0">{student.target_role}</Badge>
              <Badge variant="secondary" className="text-[10px] px-2 py-0">进度 {completedCount}/{milestones.length}</Badge>
            </div>
          )}

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {/* 欢迎消息（无历史时显示） */}
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BotMessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[85%]">
                    <p className="text-xs text-foreground leading-relaxed">
                      你好{student ? `，${student.name}` : ''}！我是你的AI职业规划顾问 🎯<br />
                      我已了解你的学习路径，可以回答关于<strong>技能学习、证书考取、岗位准备</strong>等问题。
                    </p>
                  </div>
                </div>
                <div className="pl-9 space-y-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="block w-full text-left text-xs text-primary border border-primary/30 rounded-xl px-3 py-2 hover:bg-primary/5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 消息列表 */}
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BotMessageSquare className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-2xl px-3 py-2.5 max-w-[85%] text-xs leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-secondary text-foreground rounded-tl-sm'
                  )}
                >
                  {msg.content || (msg.pending && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      思考中…
                    </span>
                  ))}
                  {msg.pending && msg.content && (
                    <span className="inline-block w-1 h-3.5 bg-current animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* 快捷问题（有对话后） */}
          {messages.length > 0 && !streaming && (
            <div className="px-3 pb-1 shrink-0">
              <div className="overflow-x-auto whitespace-nowrap flex gap-1.5 pb-1">
                {QUICK_QUESTIONS.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="inline-flex shrink-0 text-[10px] text-primary border border-primary/25 rounded-full px-2.5 py-1 hover:bg-primary/5 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入区 */}
          <div className="border-t px-3 py-2.5 shrink-0 flex items-center gap-2 bg-background">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="向AI顾问提问…"
              disabled={streaming}
              className="flex-1 min-w-0 text-xs bg-secondary rounded-xl px-3 py-2.5 outline-none border border-transparent focus:border-primary/30 placeholder:text-muted-foreground"
            />
            {streaming ? (
              <Button size="icon" variant="ghost" onClick={handleStop} className="w-9 h-9 shrink-0 text-destructive hover:bg-destructive/10">
                <ChevronDown className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="w-9 h-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AIAdvisorWidget;
