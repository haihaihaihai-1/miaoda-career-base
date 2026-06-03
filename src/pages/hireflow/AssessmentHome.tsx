/**
 * HireFlow brand - 候选人评估首页
 * - 列表展示所有候选人（来自 Supabase 持久层，失败回退到 mock）
 * - 点击查看详情（雷达图 + Gap + 双塔推荐岗位）
 * - "新建评估" → 跳到 AssessmentWizard
 * - "导出报告" → 生成水印 PDF
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  UserSearch,
  ChevronRight,
  Sparkles,
  Database,
  FlaskConical,
  Download,
  Loader2,
} from 'lucide-react';
import RadarChart5D, { type Dim5Data } from '@/components/charts/RadarChart5D';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import UserMenu from '@/components/UserMenu';
import { brand } from '@/config';
import type { Candidate, CompetencyScores } from '@/types/hireflow';
import {
  analyzeCompetencyGap,
  COMPETENCY_DIMENSIONS,
  getPositionRequirement,
  recommendDecision,
} from '@/services/competencyAnalysis';
import { isSupabaseAvailable, listCandidates, type CandidateListItem } from '@/services/hireflowDB';
import { getDualTowerClient, type MatchResult } from '@/services/dualTower';
import { generateHireflowPdf } from '@/lib/hireflowPdfReport';
import { logEvent } from '@/lib/observability';

interface Props {
  candidates: Candidate[];
  onStartNew: () => void;
  onSelect?: (id: string) => void;
}

/** mock 占位候选人，供未连 Supabase 时演示 */
export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'c-001',
    name: '张三',
    target_position: 'Senior Software Engineer',
    experience_years: 5,
    interview_stage: 'technical',
    competency_scores: {
      professional: 82, learning: 75, communication: 68, resilience: 70, leadership: 55,
    },
    overall_match_rate: 78,
    created_at: '2025-10-12T08:00:00Z',
    updated_at: '2025-10-12T08:00:00Z',
  },
  {
    id: 'c-002',
    name: '李四',
    target_position: 'Tech Lead',
    experience_years: 8,
    interview_stage: 'final',
    competency_scores: {
      professional: 88, learning: 80, communication: 82, resilience: 78, leadership: 76,
    },
    overall_match_rate: 86,
    created_at: '2025-10-13T08:00:00Z',
    updated_at: '2025-10-13T08:00:00Z',
  },
  {
    id: 'c-003',
    name: '王五',
    target_position: 'Junior Software Engineer',
    experience_years: 1,
    interview_stage: 'initial',
    competency_scores: {
      professional: 55, learning: 80, communication: 65, resilience: 62, leadership: 35,
    },
    overall_match_rate: 65,
    created_at: '2025-10-14T08:00:00Z',
    updated_at: '2025-10-14T08:00:00Z',
  },
];

const stageColor: Record<string, string> = {
  initial: 'bg-muted text-muted-foreground',
  technical: 'bg-blue-100 text-blue-800',
  final: 'bg-purple-100 text-purple-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const stageLabel: Record<string, string> = {
  initial: '初筛',
  technical: '技术面',
  final: '终面',
  offer: 'Offer',
  rejected: '已拒',
};

const recommendationLabel: Record<string, string> = {
  strong_hire: '强烈录用',
  hire: '录用',
  on_hold: '待定',
  no_hire: '不录用',
};

function scoresToRadarData(scores: CompetencyScores, targetPosition: string): Dim5Data[] {
  const req = getPositionRequirement(targetPosition).required;
  return COMPETENCY_DIMENSIONS.map((d) => ({
    label: d.name,
    current: Math.round((scores[d.key] / 100) * 5 * 10) / 10, // 0-100 → 0-5
    required: Math.round((req[d.key] / 100) * 5 * 10) / 10,
  }));
}

export default function HireflowHome({ candidates, onStartNew, onSelect }: Props) {
  // 优先用 Supabase；失败时使用入参 candidates；最后回退 mock
  const dbQuery = useQuery<CandidateListItem[]>({
    queryKey: ['hireflow-candidates'],
    queryFn: () => listCandidates(),
    enabled: isSupabaseAvailable(),
    retry: 0,
  });

  const usingDB = !!dbQuery.data && dbQuery.data.length > 0;
  const list: Candidate[] = usingDB
    ? (dbQuery.data as Candidate[])
    : candidates.length > 0
    ? candidates
    : MOCK_CANDIDATES;

  const [selected, setSelected] = useState<Candidate>(list[0]);

  // 当数据源切换后，selected 可能过期 → 同步
  useMemoSync(() => {
    if (!list.find((c) => c.id === selected.id)) setSelected(list[0]);
  }, [list]);

  const radar = useMemo(
    () =>
      selected.competency_scores
        ? scoresToRadarData(selected.competency_scores, selected.target_position)
        : [],
    [selected],
  );

  const gaps = useMemo(() => {
    if (!selected.competency_scores) return [];
    return analyzeCompetencyGap(
      selected.competency_scores,
      getPositionRequirement(selected.target_position),
    );
  }, [selected]);

  const decision = useMemo(() => {
    if (!selected.overall_match_rate) return 'on_hold' as const;
    return recommendDecision(selected.overall_match_rate, gaps);
  }, [selected, gaps]);

  // 双塔推荐：根据 selected 候选人推荐 top-3 岗位
  const matchQuery = useQuery({
    queryKey: ['hireflow-match', selected.id],
    queryFn: () => getDualTowerClient().matchCandidate(selected, 3),
    enabled: !!selected.competency_scores,
    retry: 0,
  });
  const recommendations: MatchResult[] = matchQuery.data ?? [];

  // PDF 导出
  const [exportingId, setExportingId] = useState<string | null>(null);
  const handleExport = async (c: Candidate) => {
    setExportingId(c.id);
    logEvent('hireflow.export.click', { candidate_id: c.id });
    try {
      await generateHireflowPdf({ candidate: c });
    } catch {
      /* observability 已记录 */
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate">
              <UserSearch className="size-5 text-primary flex-shrink-0" />
              <span className="truncate">{brand.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{brand.tagline}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <Badge variant="outline" className="gap-1 hidden sm:inline-flex">
              {usingDB ? (
                <>
                  <Database className="size-3" /> Supabase
                </>
              ) : (
                <>
                  <FlaskConical className="size-3" /> Mock 数据
                </>
              )}
            </Badge>
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu />
            <Button onClick={onStartNew} className="gap-2" size="sm">
              <Plus className="size-4" />
              <span className="hidden sm:inline">{brand.copy.ctaPrimary}</span>
              <span className="sm:hidden">新建</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 候选人列表 */}
        <section className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            候选人 ({list.length})
          </h2>
          {list.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelected(c);
                onSelect?.(c.id);
              }}
              className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                selected.id === c.id
                  ? 'border-primary ring-2 ring-primary/20 bg-accent'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{c.name}</span>
                <Badge className={stageColor[c.interview_stage]}>
                  {stageLabel[c.interview_stage]}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-2">{c.target_position}</div>
              <div className="flex items-center justify-between text-xs">
                <span>{c.experience_years} 年经验</span>
                {c.overall_match_rate != null && (
                  <span className="font-bold text-primary">
                    匹配 {Math.round(c.overall_match_rate)}%
                  </span>
                )}
              </div>
            </button>
          ))}
        </section>

        {/* 右侧 - 详情 */}
        <section className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selected.name} · 胜任力雷达</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{recommendationLabel[decision]}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(selected)}
                    disabled={!selected.competency_scores || exportingId === selected.id}
                    className="gap-1"
                  >
                    {exportingId === selected.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Download className="size-3" />
                    )}
                    导出 PDF
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {radar.length > 0 ? (
                <RadarChart5D data={radar} />
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  该候选人暂无评估数据，请先完成评估
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>胜任力缺口分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gaps.length === 0 ? (
                <p className="text-muted-foreground text-sm">暂无评估数据</p>
              ) : (
                gaps.map((g) => {
                  const meta = COMPETENCY_DIMENSIONS.find((d) => d.key === g.dimension)!;
                  const severityColor =
                    g.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : g.severity === 'moderate'
                      ? 'bg-orange-100 text-orange-800'
                      : g.severity === 'minor'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800';
                  const severityLabel = {
                    critical: '严重缺口',
                    moderate: '中等缺口',
                    minor: '小缺口',
                    none: '已达标',
                  }[g.severity];
                  return (
                    <div
                      key={g.dimension}
                      className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0"
                    >
                      <div>
                        <div className="font-medium">{meta.name}</div>
                        <div className="text-xs text-muted-foreground">{meta.description}</div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          当前 <b>{g.current}</b> / 要求 <b>{g.required}</b>
                        </span>
                        <Badge className={severityColor}>{severityLabel}</Badge>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* 双塔推荐岗位 */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  双塔推荐岗位 (Top {recommendations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((r) => (
                  <div
                    key={r.position_id}
                    className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{r.position_title}</div>
                      {r.reasoning && (
                        <div className="text-xs text-muted-foreground">{r.reasoning}</div>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-primary font-bold">
                      {r.match_score}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}

/** 简化的 useMemo 副作用钩子（避免引入新依赖） */
function useMemoSync(effect: () => void, deps: unknown[]): void {
  // 等价于 useEffect 但内联到 useMemo 时机
  // 这里仅用于 list 切换时同步 selected
  useMemo(() => {
    effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
