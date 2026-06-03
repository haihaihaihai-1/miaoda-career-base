// Tab1 - 首页：职业路径总览
import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { getLevelLabel } from '@/data/skillLevels';
import type { Milestone, LearningResource } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import RadarChart5D, { type Dim5Data } from '@/components/charts/RadarChart5D';
import {
  CheckCircle2, CircleDot, Circle, ChevronRight, BookOpen,
  Github, Award, TrendingUp, Target, Clock, Star, BookMarked,
  FileDown, X, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { generatePdfReport } from '@/services/pdfReport';
import CertBanner from '@/components/home/CertBanner';
import ShareCardModal from '@/components/home/ShareCardModal';
import ConfettiEffect from '@/components/home/ConfettiEffect';

// ---- 5维度评分逻辑 ----
const ROLE_DIM_REQUIRED: Record<string, [number, number, number, number, number]> = {
  'Java开发工程师':            [4, 4, 5, 4, 3],
  'Web前端开发工程师':         [4, 2, 4, 3, 3],
  'Python开发工程师':          [4, 3, 4, 3, 3],
  'AI应用开发工程师':          [4, 3, 4, 4, 3],
  '数据分析师':                [3, 4, 3, 4, 4],
  '工业机器人运维工程师':      [3, 2, 4, 4, 3],
  '智能制造系统集成工程师':    [3, 2, 5, 5, 4],
  '前端开发工程师':            [4, 2, 4, 3, 3],
  '数据分析工程师':            [3, 4, 3, 4, 4],
  '软件测试工程师':            [3, 3, 3, 3, 4],
  '云计算运维工程师':          [3, 2, 4, 3, 3],
  '大数据开发工程师':          [4, 4, 4, 4, 3],
};

const SKILL_DIM: Record<string, number> = {
  Java: 0, Python: 0, JavaScript: 0, TypeScript: 0, 'HTML/CSS': 0, 'C语言': 0, 'C#': 0,
  SQL: 1, MySQL: 1, 'Redis基础': 1,
  'Spring Boot': 2, 'Vue.js': 2, React: 2, FastAPI: 2, Docker: 2, Maven: 2,
  Webpack: 2, 'PLC编程': 2, 'ABB编程': 2, MES: 2, 'PyTorch': 2, 'Scikit-learn': 2,
  项目经验: 3, '实习经历': 3, '竞赛获奖': 3, '开源贡献': 3, Git: 3,
};

const calcDim5 = (skills: string[]): [number, number, number, number, number] => {
  const scores: [number, number, number, number, number] = [1, 1, 1, 1, 1];
  skills.forEach((sk) => {
    const dim = SKILL_DIM[sk];
    if (dim !== undefined) scores[dim] = Math.min(5, scores[dim] + 1);
  });
  scores[4] = Math.max(2, scores[4]);
  return scores;
};

const buildDim5 = (skills: string[], targetRole: string): Dim5Data[] => {
  const LABELS = ['编程能力', '数据库', '框架应用', '项目实战', '软技能'];
  const current = calcDim5(skills);
  const required = ROLE_DIM_REQUIRED[targetRole] ?? [4, 3, 4, 3, 3];
  return LABELS.map((label, i) => ({ label, current: current[i], required: required[i] }));
};

// ---- 子组件 ----

const MilestoneIcon: React.FC<{ status: Milestone['status'] }> = ({ status }) => {
  if (status === 'completed') return (
    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0">
      <CheckCircle2 className="w-4 h-4 text-success-foreground" />
    </div>
  );
  if (status === 'current') return (
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 animate-pulse-ring">
      <CircleDot className="w-4 h-4 text-primary-foreground" />
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-full border-2 border-border bg-background flex items-center justify-center shrink-0">
      <Circle className="w-4 h-4 text-muted-foreground" />
    </div>
  );
};

const stageBadgeClass = (stage: number) =>
  stage === 1 ? 'bg-accent text-accent-foreground' :
  stage === 2 ? 'bg-warning/10 text-warning' :
  'bg-success/10 text-success';

const ResourceIcon: React.FC<{ type: LearningResource['type'] }> = ({ type }) => {
  if (type === 'github') return <Github className="w-3.5 h-3.5" />;
  if (type === 'certificate') return <Award className="w-3.5 h-3.5" />;
  if (type === 'course') return <BookOpen className="w-3.5 h-3.5" />;
  return <BookMarked className="w-3.5 h-3.5" />;
};

// 里程碑详情内容（复用于抽屉和侧边面板）
const MilestoneDetail: React.FC<{ milestone: Milestone; onClose: () => void }> = ({ milestone, onClose }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-start justify-between gap-2 mb-4">
      <div className="flex items-start gap-2 min-w-0">
        <MilestoneIcon status={milestone.status} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug text-balance">{milestone.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">⏱ {milestone.duration}</p>
        </div>
      </div>
      <button type="button" onClick={onClose} className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>

    <p className="text-xs text-muted-foreground text-pretty mb-4">{milestone.description}</p>

    {milestone.status === 'current' && (
      <div className="mb-4 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-medium text-foreground">当前进度</span>
          <span className="text-primary font-semibold">{milestone.progress}%</span>
        </div>
        <Progress value={milestone.progress} className="h-2" />
      </div>
    )}

    {milestone.skills.length > 0 && (
      <div className="mb-4">
        <p className="text-xs font-semibold text-foreground mb-2">本阶段技能</p>
        <div className="flex flex-wrap gap-1.5">
          {milestone.skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs px-2 py-0.5">{skill}</Badge>
          ))}
        </div>
      </div>
    )}

    {milestone.resources.length > 0 && (
      <div className="mb-4">
        <p className="text-xs font-semibold text-foreground mb-2">学习资源</p>
        <div className="space-y-2">
          {milestone.resources.map((res, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary border border-border">
              <div className="mt-0.5 text-primary shrink-0"><ResourceIcon type={res.type} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{res.title}</p>
                {res.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 text-pretty">{res.description}</p>
                )}
              </div>
              {res.badge && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{res.badge}</Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="p-3 rounded-xl bg-accent border border-primary/20 mt-auto">
      <p className="text-xs font-semibold text-primary mb-1">下一步建议</p>
      <p className="text-xs text-foreground text-pretty">
        {milestone.status === 'completed'
          ? '恭喜完成本阶段！继续保持学习节奏，向下一里程碑进发。'
          : milestone.status === 'current'
            ? `专注当前任务，完成${milestone.skills[0] || '核心技能'}的系统学习，争取本周有实质性进展。`
            : '请先完成进行中的里程碑，完成后将解锁本阶段内容。'}
      </p>
    </div>
  </div>
);

// ---- 主页组件 ----
const PRESET_CARDS = [
  {
    key: 'java' as const,
    title: 'Java开发工程师路径',
    major: '软件技术专业',
    desc: '从Spring Boot到微服务架构，30周企业级开发实战',
    icon: '☕',
    color: 'border-l-primary',
  },
  {
    key: 'ai' as const,
    title: 'AI应用开发工程师路径',
    major: '人工智能技术应用专业',
    desc: '大模型API调用、Prompt工程到AI产品落地',
    icon: '🤖',
    color: 'border-l-success',
  },
  {
    key: 'robot' as const,
    title: '工业机器人运维路径',
    major: '智能制造装备技术专业',
    desc: 'PLC编程、ABB机器人到智能产线系统集成',
    icon: '⚙️',
    color: 'border-l-warning',
  },
];

const HomePage: React.FC = () => {
  const { student, careerPath, milestones, setActiveTab, isDemo, completeMilestone, loadPreset, aiLoading, aiLoadingStep } = useApp();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // AI 加载中全屏
  if (aiLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8 py-16 bg-background">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-base font-bold text-foreground text-balance">{aiLoadingStep || 'AI正在分析你的能力差距…'}</p>
          <p className="text-sm text-muted-foreground text-pretty">请稍候，这通常需要10-30秒</p>
        </div>
        <div className="w-full max-w-xs">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full w-3/5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 空状态 — 引导卡片
  if (!student || !careerPath) {
    return (
      <div className="min-h-full bg-background pb-8">
        {/* 顶部引导区 */}
        <div className="bg-gradient-primary px-6 pt-8 pb-10 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-1">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white text-balance">开启你的职业学习之旅</h2>
          <p className="text-sm text-white/80 text-pretty max-w-xs">完成6步引导问卷，获取专属学习路径与岗位匹配方案</p>
          <Button
            variant="ghost"
            onClick={() => setActiveTab(1)}
            className="mt-2 bg-white text-primary font-semibold rounded-xl px-8 h-11 hover:bg-white/90 hover:text-primary"
          >
            立即开始
          </Button>
        </div>

        {/* 快速入门场景卡片 */}
        <div className="px-4 -mt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">快速入门</p>
          <div className="space-y-3">
            {PRESET_CARDS.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => loadPreset(card.key)}
                className={cn(
                  'w-full text-left rounded-2xl border bg-card shadow-card p-4',
                  'border-l-4 transition-transform active:scale-[0.98]',
                  card.color
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 leading-none mt-0.5">{card.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground text-balance">{card.title}</p>
                    <p className="text-[11px] text-primary font-medium mt-0.5">{card.major}</p>
                    <p className="text-xs text-muted-foreground mt-1 text-pretty">{card.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            点击任意卡片自动加载演示路径 · 或
            <button type="button" onClick={() => setActiveTab(1)} className="text-primary font-medium ml-1">
              自定义填写
            </button>
          </p>
        </div>
      </div>
    );
  }

  // 匹配度
  const requiredDims = ROLE_DIM_REQUIRED[student.target_role] ?? [4, 3, 4, 3, 3];
  const currentDims = calcDim5(student.skills);
  const totalReq = requiredDims.reduce((a, b) => a + b, 0);
  const totalCur = currentDims.reduce((a, b, i) => a + Math.min(b, requiredDims[i]), 0);
  const matchRate = Math.round((totalCur / totalReq) * 100);
  const dim5Data = buildDim5(student.skills, student.target_role);

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const currentCount = milestones.filter((m) => m.status === 'current').length;
  const upcomingCount = milestones.filter((m) => m.status === 'upcoming').length;
  const stageNames = ['基础期', '强化期', '冲刺期'];

  const handleMilestoneClick = (m: Milestone) => {
    setSelectedMilestone(m);
    if (window.innerWidth >= 768) {
      setPanelOpen(true);
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
      setPanelOpen(false);
    }
  };

  const handleCloseDetail = () => {
    setDrawerOpen(false);
    setPanelOpen(false);
  };

  // PDF导出 — 优先调用 pdf-lib Edge Function，失败自动 fallback 到 jsPDF
  const handleExportPdf = useCallback(async () => {
    if (!student || !careerPath) return;
    setPdfLoading(true);
    toast.info('正在生成PDF报告，请稍候…');
    try {
      await generatePdfReport({
        student,
        careerPath,
        milestones,
        matchRate: 70,
        screenshotElement: printRef.current,
      });
      toast.success('PDF报告已导出！');
    } catch {
      toast.error('导出失败，请重试');
    } finally {
      setPdfLoading(false);
    }
  }, [student, careerPath, milestones]);

  // 确认标记完成
  const handleConfirmComplete = () => {
    if (confirmId === null) return;
    completeMilestone(confirmId);
    setSelectedMilestone((prev) => prev?.id === confirmId ? { ...prev, status: 'completed', progress: 100 } : prev);
    setConfirmId(null);
    setShowConfetti(true);
    toast.success('里程碑已完成！下一阶段已解锁 🎉');
  };

  return (
    <div className="min-h-full bg-background pb-6">
      {/* 1+X证书报名提醒 Banner */}
      <CertBanner careerPath={careerPath} milestones={milestones} />

      {/* 庆祝动画 */}
      <ConfettiEffect active={showConfetti} onDone={() => setShowConfetti(false)} />

      {/* 分享卡片弹窗 */}
      <ShareCardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        student={student}
        careerPath={careerPath}
        matchRate={matchRate}
      />

      {/* 可打印区域 */}
      <div ref={printRef} id="pdf-export-content">
        {/* 顶部信息卡片 */}
        <div className="bg-gradient-primary px-4 pt-4 pb-6">
          {isDemo && (
            <div className="mb-3 px-3 py-1.5 bg-warning/20 rounded-lg text-xs text-warning font-medium text-center">
              演示模式 · 使用引导页创建你的专属路径
            </div>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold text-white truncate">{student.name}</span>
                <span className="text-xs text-white/70 shrink-0">{student.grade} · {student.major}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                <Target className="w-3.5 h-3.5 text-white/80 shrink-0" />
                <span className="text-sm text-white/90 truncate">{student.target_role}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span className="shrink-0">{getLevelLabel(student.current_level)}</span>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="shrink-0 text-white font-semibold">高级工（L4）</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full border-2 border-white/40 bg-white/10 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white leading-none">{matchRate}%</span>
                <span className="text-[9px] text-white/70 leading-none mt-0.5">匹配度</span>
              </div>
              {/* 导出PDF + 分享按钮 */}
              <div className="flex flex-col items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportPdf}
                  disabled={pdfLoading}
                  className="h-7 px-2 text-[11px] border border-white/50 text-white hover:bg-white/15 gap-1 shrink-0"
                >
                  <FileDown className="w-3 h-3" />
                  {pdfLoading ? '生成中…' : '导出PDF'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShareOpen(true)}
                  className="h-7 px-2 text-[11px] border border-white/50 text-white hover:bg-white/15 gap-1 shrink-0"
                >
                  <Share2 className="w-3 h-3" />
                  分享路径
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-white/70">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{careerPath.total_weeks}周路径</span>
              <span>{careerPath.total_hours}学时</span>
            </div>
            <Progress
              value={Math.round((completedCount / Math.max(milestones.length, 1)) * 100)}
              className="h-1.5 bg-white/20 [&>div]:bg-white"
            />
          </div>
        </div>

        {/* 内容区（两列：时间轴 + 桌面侧边面板） */}
        <div className="px-4 -mt-3 flex gap-4">
          {/* 左侧主内容 */}
          <div className="flex-1 min-w-0">
            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: '已完成', value: completedCount, color: 'text-success', bg: 'bg-success/10' },
                { label: '进行中', value: currentCount, color: 'text-primary', bg: 'bg-accent' },
                { label: '待开始', value: upcomingCount, color: 'text-muted-foreground', bg: 'bg-muted' }
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={cn('rounded-xl p-3 text-center shadow-card', bg)}>
                  <p className={cn('text-xl font-bold', color)}>{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* 5维雷达图 */}
            <Card className="shadow-card border-border mb-4">
              <CardContent className="p-4">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  能力差距分析
                </h3>
                <RadarChart5D data={dim5Data} size={230} />
              </CardContent>
            </Card>

            {/* 时间轴 */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                学习里程碑
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />
                <div className="space-y-3">
                  {milestones.map((milestone, idx) => {
                    const isNewStage = idx === 0 || milestones[idx - 1].stage !== milestone.stage;
                    const isCurrent = milestone.status === 'current';
                    const isSelected = selectedMilestone?.id === milestone.id;
                    return (
                      <div key={milestone.id}>
                        {isNewStage && (
                          <div className="flex items-center gap-2 mb-2 pl-12">
                            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', stageBadgeClass(milestone.stage))}>
                              {stageNames[milestone.stage - 1]}
                            </span>
                          </div>
                        )}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleMilestoneClick(milestone)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMilestoneClick(milestone); } }}
                          className="w-full text-left cursor-pointer"
                        >
                          <div className="relative flex items-start gap-3 py-2 transition-transform active:scale-[0.99]">
                            <div className="z-10 shrink-0 mt-0.5">
                              <MilestoneIcon status={milestone.status} />
                            </div>
                            <div className={cn(
                              'flex-1 min-w-0 rounded-xl p-3 shadow-card border transition-colors',
                              milestone.status === 'completed' ? 'bg-success/5 border-success/20' :
                              isCurrent ? 'bg-card border-primary/30' :
                              'bg-card border-border',
                              isSelected && 'ring-2 ring-primary/30'
                            )}>
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                  'text-sm font-semibold leading-snug flex-1 min-w-0 text-balance',
                                  milestone.status === 'completed' ? 'text-success' :
                                  isCurrent ? 'text-primary' : 'text-muted-foreground'
                                )}>
                                  {milestone.title}
                                </p>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 text-pretty line-clamp-2">
                                {milestone.description}
                              </p>
                              <div className="flex items-center justify-between mt-2 gap-2">
                                <span className="text-[10px] text-muted-foreground">{milestone.duration}</span>
                                <div className="flex items-center gap-2">
                                  {isCurrent && milestone.progress > 0 && (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Progress value={milestone.progress} className="h-1 w-14" />
                                      <span className="text-[10px] text-primary font-medium shrink-0">{milestone.progress}%</span>
                                    </div>
                                  )}
                                  {/* 标记完成按钮（仅进行中） */}
                                  {isCurrent && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setConfirmId(milestone.id); }}
                                      className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md border border-primary/60 text-primary hover:bg-primary/10 transition-colors leading-none"
                                    >
                                      标记完成
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 桌面端右侧详情面板（≥768px，sticky） */}
          {panelOpen && selectedMilestone && (
            <aside
              className={cn(
                'hidden md:flex flex-col w-80 shrink-0',
                'sticky top-4 self-start max-h-[calc(100vh-5rem)] overflow-y-auto',
                'rounded-2xl border border-border bg-card shadow-lg p-4',
                'animate-slide-up'
              )}
            >
              <MilestoneDetail milestone={selectedMilestone} onClose={handleCloseDetail} />
            </aside>
          )}
        </div>
      </div>

      {/* 移动端底部抽屉（<768px） */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-2xl px-4 pb-6 md:hidden">
          {selectedMilestone && (
            <>
              <SheetHeader className="mb-2">
                <SheetTitle className="sr-only">里程碑详情</SheetTitle>
              </SheetHeader>
              <MilestoneDetail milestone={selectedMilestone} onClose={() => setDrawerOpen(false)} />
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 确认完成弹窗 */}
      <AlertDialog open={confirmId !== null} onOpenChange={(open) => { if (!open) setConfirmId(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>确认完成该阶段？</AlertDialogTitle>
            <AlertDialogDescription>
              完成后该里程碑将标记为已完成，下一个待开始阶段将自动激活，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete} className="bg-primary text-primary-foreground">
              确认完成
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HomePage;
