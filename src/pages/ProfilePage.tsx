// Tab4 - 我的页面
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getLevelLabel } from '@/data/skillLevels';
import { courses } from '@/data/courses';
import type { CareerPath, Milestone } from '@/types/types';
import {
  User, BookOpen, Award, BarChart2, Settings, RefreshCw,
  CheckCircle2, Clock, GraduationCap, Briefcase, ChevronRight,
  Star, Trophy, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import DifyConfigCard from '@/components/profile/DifyConfigCard';

// ---- 推荐1+X证书进度子组件 ----

/** 从路径的 stages.certificates 中提取所有推荐证书 */
function extractRecommendedCerts(careerPath: CareerPath | null): string[] {
  if (!careerPath) return [];
  const all: string[] = [];
  careerPath.stages.forEach((s) => s.certificates.forEach((c) => { if (!all.includes(c)) all.push(c); }));
  return all.slice(0, 3);
}

/** 解析 weeks_range "第9-20周" → 结束周数 */
function parseEndWeek(weeksRange: string): number {
  const m = weeksRange.match(/(\d+)[^\d]*$/);
  return m ? parseInt(m[1], 10) : 0;
}

/** 从 localStorage 获取路径生成时间（毫秒），不存在则写入 now */
const PATH_START_KEY = 'career_path_start_ts';
function getPathStartTs(): number {
  try {
    const stored = localStorage.getItem(PATH_START_KEY);
    if (stored) return parseInt(stored, 10);
  } catch { /* ignore */ }
  const now = Date.now();
  try { localStorage.setItem(PATH_START_KEY, String(now)); } catch { /* ignore */ }
  return now;
}

/** 计算某证书的预计报名截止日期（路径开始 + 所属 stage 结束周 × 7天）*/
function certRegistrationDate(certName: string, careerPath: CareerPath): Date | null {
  const stage = careerPath.stages.find((s) => s.certificates.includes(certName));
  if (!stage) return null;
  const endWeek = parseEndWeek(stage.weeks_range);
  if (!endWeek) return null;
  const startTs = getPathStartTs();
  return new Date(startTs + endWeek * 7 * 24 * 60 * 60 * 1000);
}

/** 倒计时文字：正数→"距报名还有N天"（橙色），已过→"报名进行中"（绿色）*/
function countdownLabel(date: Date): { text: string; className: string } {
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return { text: `距报名还有 ${diffDays} 天`, className: 'text-warning' };
  }
  return { text: '报名进行中', className: 'text-success' };
}

/** 根据里程碑完成情况估算证书获取状态 (0/30/60/100) */
function certProgress(certName: string, milestones: Milestone[], careerPath: CareerPath | null): number {
  if (!careerPath) return 0;
  // 找到包含该证书的最高 stage
  let certStage = 0;
  careerPath.stages.forEach((s) => {
    if (s.certificates.includes(certName)) certStage = Math.max(certStage, s.stage);
  });
  if (certStage === 0) return 0;
  // 计算该 stage 及之前里程碑完成率
  const stageMilestones = milestones.filter((m) => m.stage <= certStage);
  if (stageMilestones.length === 0) return 0;
  const completedInStage = stageMilestones.filter((m) => m.status === 'completed').length;
  const currentInStage = stageMilestones.filter((m) => m.status === 'current').length;
  const ratio = (completedInStage + currentInStage * 0.5) / stageMilestones.length;
  if (ratio >= 1) return 100;
  if (ratio >= 0.6) return 60;
  if (ratio >= 0.3) return 30;
  return 0;
}

const CERT_STATUS_LABELS: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  0:   { label: '未开始', color: 'text-muted-foreground', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  30:  { label: '可报名', color: 'text-primary',          icon: <BookOpen className="w-3.5 h-3.5" /> },
  60:  { label: '准备中', color: 'text-warning',          icon: <Clock className="w-3.5 h-3.5" /> },
  100: { label: '已获得', color: 'text-success',          icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const CertProgressCard: React.FC<{ careerPath: CareerPath | null; milestones: Milestone[] }> = ({
  careerPath, milestones,
}) => {
  const certs = extractRecommendedCerts(careerPath);
  if (certs.length === 0) return null;

  return (
    <Card className="shadow-card border-border mb-4">
      <CardHeader className="pb-2 pt-4 px-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          推荐考取证书
        </h3>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {certs.map((cert) => {
          const prog = certProgress(cert, milestones, careerPath);
          const statusInfo = CERT_STATUS_LABELS[prog] ?? CERT_STATUS_LABELS[0];
          const regDate = careerPath ? certRegistrationDate(cert, careerPath) : null;
          const countdown = prog < 100 && regDate ? countdownLabel(regDate) : null;
          return (
            <div key={cert} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground text-pretty leading-snug">{cert}</p>
                  <div className={cn('flex items-center gap-1 mt-0.5', statusInfo.color)}>
                    {statusInfo.icon}
                    <span className="text-[10px] font-medium">{statusInfo.label}</span>
                  </div>
                  {countdown && (
                    <span className={cn('text-[10px] font-medium mt-0.5 block', countdown.className)}>
                      {countdown.text}
                    </span>
                  )}
                </div>
                <span className={cn('text-sm font-bold shrink-0', statusInfo.color)}>{prog}%</span>
              </div>
              <Progress value={prog} className="h-1.5" />
            </div>
          );
        })}
        <p className="text-[10px] text-muted-foreground pt-1">
          进度基于已完成里程碑自动计算 · 100%表示建议参加考试
        </p>
      </CardContent>
    </Card>
  );
};

const ProfilePage: React.FC = () => {
  const { student, careerPath, milestones, clearData, loadDemo, isDemo } = useApp();

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6 py-16">
        <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-base font-bold text-foreground">尚未创建档案</h2>
          <p className="text-sm text-muted-foreground text-pretty">完成引导页填写后，这里将展示你的学习档案</p>
        </div>
        <Button
          variant="outline"
          onClick={loadDemo}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          加载演示数据
        </Button>
      </div>
    );
  }

  // 统计已完成里程碑
  const completedMilestones = milestones.filter((m) => m.status === 'completed');
  const totalHours = careerPath?.total_hours || 0;
  const completedHours = Math.round(
    completedMilestones.length > 0
      ? (completedMilestones.length / milestones.length) * totalHours
      : 0
  );
  const completionRate =
    milestones.length > 0
      ? Math.round((completedMilestones.length / milestones.length) * 100)
      : 0;

  // 已完成课程（取学生专业且已标记 completed 的阶段课程名）
  const completedCourseNames: string[] = completedMilestones.flatMap((m) => m.skills);
  const completedCourses = courses
    .filter((c) => c.major === student.major && completedCourseNames.includes(c.name))
    .slice(0, 5);

  const handleReset = () => {
    clearData();
    toast.success('已清除数据，请重新填写引导问卷');
  };

  const avatarLetters = student.name.slice(0, 1);

  return (
    <div className="min-h-full bg-background pb-4">
      {/* 个人信息头部 */}
      <div className="bg-gradient-primary px-4 pt-5 pb-8">
        <div className="flex items-center gap-4">
          {/* 头像 */}
          <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-white">{avatarLetters}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{student.name}</p>
            <p className="text-sm text-white/80 mt-0.5 truncate">{student.grade} · {student.major}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="secondary" className="text-[10px] px-2 py-0 bg-white/20 text-white border-0">
                {getLevelLabel(student.current_level)}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-2 py-0 bg-white/20 text-white border-0">
                {student.education}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.info('设置功能开发中')}
            className="shrink-0 w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* 目标岗位 */}
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-white/10">
          <Briefcase className="w-4 h-4 text-white/80 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white/60">目标岗位</p>
            <p className="text-sm font-semibold text-white truncate">{student.target_role}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/50 shrink-0" />
        </div>
      </div>

      {/* 学习统计 */}
      <div className="px-4 -mt-4">
        {/* Dify AI 配置 */}
        <DifyConfigCard />
        <Card className="shadow-card border-border mb-4">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              学习统计
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: '总学时', value: `${totalHours}h`, icon: Clock, color: 'text-primary' },
                { label: '已完成', value: `${completedHours}h`, icon: CheckCircle2, color: 'text-success' },
                { label: '里程碑', value: `${completedMilestones.length}/${milestones.length}`, icon: Star, color: 'text-warning' }
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary">
                  <Icon className={cn('w-4 h-4 shrink-0', color)} />
                  <p className={cn('text-base font-bold', color)}>{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">总体进度</span>
                <span className="font-semibold text-primary">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* 已获技能 */}
        <Card className="shadow-card border-border mb-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              已掌握技能
            </h3>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {student.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {student.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs px-2 py-1 bg-success/10 text-success border border-success/25">
                    <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">暂未记录技能，完成引导页填写后更新</p>
            )}
          </CardContent>
        </Card>

        {/* 已完成课程 */}
        <Card className="shadow-card border-border mb-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              已完成课程
            </h3>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {completedCourses.length > 0 ? (
              <div className="space-y-2">
                {completedCourses.map((course) => (
                  <div key={course.id} className="flex items-center gap-3 py-1.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{course.name}</p>
                      <p className="text-[10px] text-muted-foreground">{course.semester} · {course.credits}学分 · {course.hours}学时</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">L{course.skill_level}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {completedMilestones.length === 0
                  ? '完成里程碑后，相关课程将在此显示'
                  : '暂无匹配课程记录'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 已获证书 */}
        <Card className="shadow-card border-border mb-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              已获证书
            </h3>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {student.certificates.length > 0 ? (
              <div className="space-y-2">
                {student.certificates.map((cert) => (
                  <div key={cert} className="flex items-center gap-3 py-1.5">
                    <Award className="w-4 h-4 text-warning shrink-0" />
                    <p className="text-xs text-foreground flex-1 min-w-0 truncate">{cert}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">暂无证书记录，完成路径后将推荐相关考证</p>
            )}
          </CardContent>
        </Card>

        {/* 推荐考取证书 — 1+X 证书进度 */}
        <CertProgressCard careerPath={careerPath} milestones={milestones} />

        {/* 操作区 */}
        <Separator className="my-3" />
        <div className="space-y-2">
          {isDemo && (
            <Button
              variant="outline"
              className="w-full h-11 rounded-lg text-sm"
              onClick={() => toast.info('请前往引导页填写个人信息以创建专属路径')}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              创建我的专属路径
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full h-11 rounded-lg text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleReset}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            清除数据重新开始
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
