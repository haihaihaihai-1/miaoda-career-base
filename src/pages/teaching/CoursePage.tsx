/**
 * Teaching brand - 课程详情页
 * 展示单门课程的进度、知识点、推荐资源
 */
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, BookOpen, Target, GraduationCap, ExternalLink } from 'lucide-react';
import { fetchCourseProgress, type CourseProgress, type KnowledgePoint } from '@/services/teachingAPI';

interface Props {
  courseId: string;
  courseName: string;
  onBack: () => void;
}

const MOCK_PROGRESS: CourseProgress = {
  course_id: 'mock',
  current_chapter: 6,
  total_chapters: 12,
  knowledge_points: [
    { id: 'kp-a', name: '类与对象', category: 'OOP 基础', mastery: 90, related_resources: [] },
    { id: 'kp-b', name: '继承与多态', category: 'OOP 进阶', mastery: 75, related_resources: [] },
    { id: 'kp-c', name: '泛型', category: 'Java 进阶', mastery: 55, related_resources: [] },
    { id: 'kp-d', name: '并发与锁', category: 'Java 进阶', mastery: 40, related_resources: [] },
    { id: 'kp-e', name: 'JVM 内存模型', category: 'JVM', mastery: 35, related_resources: [] },
  ],
  last_activity_at: new Date().toISOString(),
};

export default function CoursePage({ courseId, courseName, onBack }: Props) {
  const q = useQuery({
    queryKey: ['teaching-course-progress', courseId],
    queryFn: () => fetchCourseProgress(courseId),
    retry: 0,
  });

  const progress: CourseProgress = q.data ?? MOCK_PROGRESS;
  const completionPct = Math.round(
    (progress.current_chapter / progress.total_chapters) * 100,
  );

  const groupedKps = progress.knowledge_points.reduce<Record<string, KnowledgePoint[]>>(
    (acc, kp) => {
      (acc[kp.category] ??= []).push(kp);
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              {courseName}
            </h1>
            <p className="text-xs text-muted-foreground">课程详情</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 总体进度 */}
        <section className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="size-4 text-primary" />
                课程进度
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  已学 {progress.current_chapter} / {progress.total_chapters} 章
                </span>
                <span className="text-lg font-bold text-primary">{completionPct}%</span>
              </div>
              <Progress value={completionPct} />
              <p className="text-xs text-muted-foreground">
                最近学习时间：{new Date(progress.last_activity_at).toLocaleString('zh-CN')}
              </p>
            </CardContent>
          </Card>

          {/* 按分类分组的知识点 */}
          {Object.entries(groupedKps).map(([cat, kps]) => (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="size-4" />
                  {cat}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {kps.length} 个知识点
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {kps.map((kp) => (
                  <div
                    key={kp.id}
                    className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0"
                  >
                    <div className="font-medium text-sm">{kp.name}</div>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={kp.mastery} className="w-20" />
                      <span className="text-xs font-bold w-10 text-right">
                        {kp.mastery}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        {/* 推荐资源（右侧） */}
        <section>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">学习建议</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-2">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <ExternalLink className="size-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>
                      重点加强掌握度 &lt; 50% 的知识点（{
                        progress.knowledge_points.filter((k) => k.mastery < 50).length
                      } 个）
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ExternalLink className="size-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>建议每周完成 1-2 章节，保持学习节奏</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ExternalLink className="size-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>遇到不懂的知识点，使用首页 AI 助教对话提问</span>
                  </li>
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
