/**
 * Teaching brand - 知识点弱项总览页
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Brain, AlertTriangle } from 'lucide-react';
import { fetchKnowledgeGaps, type KnowledgePoint } from '@/services/teachingAPI';

interface Props {
  onBack: () => void;
}

const MOCK: KnowledgePoint[] = [
  { id: 'kp-1', name: 'Spring Bean 生命周期', category: 'Spring', mastery: 35, related_resources: [] },
  { id: 'kp-2', name: 'JVM 内存模型', category: 'Java 基础', mastery: 48, related_resources: [] },
  { id: 'kp-3', name: 'MySQL 索引优化', category: '数据库', mastery: 55, related_resources: [] },
  { id: 'kp-4', name: '并发与锁', category: 'Java 进阶', mastery: 40, related_resources: [] },
  { id: 'kp-5', name: 'Redis 持久化', category: '缓存', mastery: 30, related_resources: [] },
  { id: 'kp-6', name: 'TCP 三次握手', category: '网络', mastery: 45, related_resources: [] },
];

function severityBadge(mastery: number) {
  if (mastery < 40) return { label: '严重不足', color: 'bg-red-100 text-red-800' };
  if (mastery < 60) return { label: '需加强', color: 'bg-amber-100 text-amber-800' };
  return { label: '已掌握', color: 'bg-green-100 text-green-800' };
}

export default function KnowledgeGapPage({ onBack }: Props) {
  const q = useQuery({
    queryKey: ['teaching-knowledge-gaps'],
    queryFn: fetchKnowledgeGaps,
    retry: 0,
  });

  const gaps: KnowledgePoint[] = q.data ?? MOCK;

  const sorted = useMemo(
    () => [...gaps].sort((a, b) => a.mastery - b.mastery),
    [gaps],
  );

  const counts = useMemo(() => {
    let critical = 0;
    let warn = 0;
    for (const k of gaps) {
      if (k.mastery < 40) critical++;
      else if (k.mastery < 60) warn++;
    }
    return { critical, warn, total: gaps.length };
  }, [gaps]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Brain className="size-5 text-primary" />
              知识点弱项总览
            </h1>
            <p className="text-xs text-muted-foreground">
              共 {counts.total} 个知识点 · 严重 {counts.critical} · 需加强 {counts.warn}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 max-w-3xl space-y-4">
        {counts.critical > 0 && (
          <Card className="border-red-200 bg-red-50/30">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="size-5 text-red-600" />
              <div>
                <div className="font-semibold text-red-800">建议优先复习</div>
                <p className="text-sm text-red-700">
                  有 {counts.critical} 个知识点掌握度低于 40%，建议本周加强练习。
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">按掌握度排序</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sorted.map((kp) => {
              const sev = severityBadge(kp.mastery);
              return (
                <div
                  key={kp.id}
                  className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">{kp.name}</div>
                    <div className="text-xs text-muted-foreground">{kp.category}</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <Progress value={kp.mastery} className="w-24" />
                    <span className="text-sm font-bold w-10 text-right">{kp.mastery}%</span>
                    <Badge className={sev.color}>{sev.label}</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
