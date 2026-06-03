/**
 * Teaching brand · 学情主页
 * - 进度卡片（来自 teachingAPI）
 * - 知识点雷达 / 弱项列表
 * - AI 助教对话区（流式接 LLM.py）
 *
 * 后端不可用时，回退到 mock 数据保证 UI 可演示
 */
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Sparkles,
  Send,
  GraduationCap,
  Brain,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { brand } from '@/config';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import UserMenu from '@/components/UserMenu';
import {
  fetchMyEnrollments,
  fetchKnowledgeGaps,
  type Enrollment,
  type KnowledgePoint,
} from '@/services/teachingAPI';
import {
  streamTeachingChat,
  type TeachingChatMessage,
} from '@/services/teachingLLM';

interface Props {
  onOpenCourse?: (courseId: string, courseName: string) => void;
  onOpenGaps?: () => void;
}

const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: 'e-001',
    course_id: 'c-101',
    course_name: 'Java 程序设计',
    semester: '2024-1',
    credits: 4,
    status: 'in_progress',
    progress: 68,
  },
  {
    id: 'e-002',
    course_id: 'c-102',
    course_name: 'Spring Boot 实战',
    semester: '2024-1',
    credits: 3,
    status: 'in_progress',
    progress: 42,
  },
  {
    id: 'e-003',
    course_id: 'c-103',
    course_name: '数据库原理',
    semester: '2024-1',
    credits: 4,
    status: 'completed',
    grade: 'A',
    progress: 100,
  },
];

const MOCK_GAPS: KnowledgePoint[] = [
  { id: 'kp-1', name: 'Spring Bean 生命周期', category: 'Spring', mastery: 35, related_resources: [] },
  { id: 'kp-2', name: 'JVM 内存模型', category: 'Java 基础', mastery: 48, related_resources: [] },
  { id: 'kp-3', name: 'MySQL 索引优化', category: '数据库', mastery: 55, related_resources: [] },
  { id: 'kp-4', name: '并发与锁', category: 'Java 进阶', mastery: 40, related_resources: [] },
];

export default function TeachingHome({ onOpenCourse, onOpenGaps }: Props) {
  const enrollmentQuery = useQuery({
    queryKey: ['teaching-enrollments'],
    queryFn: fetchMyEnrollments,
    retry: 0,
    // 失败时静默使用 mock
  });

  const gapsQuery = useQuery({
    queryKey: ['teaching-gaps'],
    queryFn: fetchKnowledgeGaps,
    retry: 0,
  });

  const enrollments: Enrollment[] = enrollmentQuery.data ?? MOCK_ENROLLMENTS;
  const gaps: KnowledgePoint[] = gapsQuery.data ?? MOCK_GAPS;

  const usingMock = !enrollmentQuery.data || !gapsQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="size-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{brand.name}</h1>
              <p className="text-sm text-muted-foreground">{brand.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {usingMock && (
              <Badge variant="outline" className="gap-1">
                <Activity className="size-3" />
                演示数据
              </Badge>
            )}
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 课程进度 */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="size-4" />
            我的课程 ({enrollments.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((e) => (
              <Card
                key={e.id}
                className={onOpenCourse ? 'cursor-pointer hover:border-primary' : ''}
                onClick={() => onOpenCourse?.(e.course_id, e.course_name)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{e.course_name}</span>
                    <Badge
                      variant={e.status === 'completed' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {e.status === 'completed' ? '已修完' : '进行中'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground mb-2">
                    {e.semester} · {e.credits} 学分 {e.grade ? `· 成绩 ${e.grade}` : ''}
                  </div>
                  <Progress value={e.progress} />
                  <div className="text-xs text-right mt-1">{e.progress}%</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 知识点弱项 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="size-4 text-primary" />
                  需要加强的知识点
                </span>
                {onOpenGaps && (
                  <Button variant="ghost" size="sm" onClick={onOpenGaps} className="gap-1">
                    查看全部
                    <ChevronRight className="size-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gaps.map((kp) => (
                <div key={kp.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="font-medium text-sm">{kp.name}</div>
                    <div className="text-xs text-muted-foreground">{kp.category}</div>
                  </div>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={kp.mastery} className="w-20" />
                    <span className="text-xs font-bold w-8 text-right">{kp.mastery}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* AI 助教 */}
        <section className="lg:col-span-1">
          <AIAssistantPanel />
        </section>
      </main>
    </div>
  );
}

// ============================================================================
// AI 助教面板 (流式)
// ============================================================================

function AIAssistantPanel() {
  const [messages, setMessages] = useState<TeachingChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是 AI 助教。可以问我任何关于课程的问题，我会基于你的学情给出针对性回答。',
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
    const text = input.trim();
    if (!text || pending) return;

    const userMsg: TeachingChatMessage = { role: 'user', content: text };
    const next = [...messages, userMsg, { role: 'assistant' as const, content: '' }];
    setMessages(next);
    setInput('');
    setPending(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await streamTeachingChat(
        { messages: [...messages, userMsg] },
        (chunk) => {
          if (chunk.type === 'token' && chunk.content) {
            setMessages((cur) => {
              const copy = [...cur];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = { ...last, content: last.content + (chunk.content ?? '') };
              return copy;
            });
          }
          if (chunk.type === 'error') {
            setMessages((cur) => {
              const copy = [...cur];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = {
                ...last,
                content:
                  last.content ||
                  `（连接 LLM 失败：${chunk.error ?? '未知错误'}。请检查 VITE_LLM_PROXY_URL）`,
              };
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
    <Card className="h-[calc(100vh-10rem)] flex flex-col sticky top-6">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          AI 助教
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
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
                {m.content || (m.role === 'assistant' && pending ? '…' : '')}
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
                handleSend();
              }
            }}
            placeholder="问任何课程问题..."
            disabled={pending}
          />
          <Button size="icon" onClick={handleSend} disabled={pending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
