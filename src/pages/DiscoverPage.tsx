// Tab3 - 发现页：热门岗位
import { useState, useMemo } from 'react';
import { CompanyHiringPanel } from '@/components/CompanyHiringPanel';
import { jobRoles } from '@/data/jobRoles';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Code2, Brain, Cpu, Layout, BarChart2, Bug, Server, Database,
  Search, ChevronRight, Banknote, GraduationCap, TrendingUp, X,
  Briefcase, ArrowRight,
  Sparkles, Eye, Settings, Wrench, Network, Shield, Cloud, Monitor,
  ShoppingCart, Radio, Globe, Share2, PieChart, HardDrive, Table, Tag,
  Palette, Film, Box, Gamepad2, Car, Battery, Plug, Zap, Smartphone, Bot,
} from 'lucide-react';
import type { JobRole } from '@/types/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2, Brain, Cpu, Layout, BarChart2, Bug, Server, Database,
  Sparkles, Eye, Settings, Wrench, Network, Shield, Cloud, Monitor,
  ShoppingCart, Radio, Globe, Share2, PieChart, HardDrive, Table, Tag,
  Palette, Film, Box, Gamepad2, Car, Battery, Plug, Zap, Smartphone, Bot,
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-muted text-muted-foreground border-border',
  2: 'bg-muted text-muted-foreground border-border',
  3: 'bg-success/10 text-success border-success/30',
  4: 'bg-primary/10 text-primary border-primary/30',
  5: 'bg-warning/10 text-warning border-warning/30',
  6: 'bg-destructive/10 text-destructive border-destructive/30',
};

/** 专业筛选标签配置 */
const MAJOR_FILTERS = [
  { label: '全部',     value: 'all' },
  { label: '软件技术', value: '软件技术' },
  { label: '人工智能', value: '人工智能' },
  { label: '智能制造', value: '智能制造' },
  { label: '计算机网络', value: '计算机网络' },
  { label: '电子商务', value: '电子商务' },
  { label: '大数据',   value: '大数据' },
  { label: '数字媒体', value: '数字媒体' },
  { label: '新能源',   value: '新能源' },
] as const;

type MajorFilter = typeof MAJOR_FILTERS[number]['value'];

const DiscoverPage: React.FC = () => {
  const { setActiveTab, student, prefillTargetRole } = useApp();
  const [query, setQuery] = useState('');
  const [majorFilter, setMajorFilter] = useState<MajorFilter>('all');
  const [detailJob, setDetailJob] = useState<JobRole | null>(null);

  const filtered = useMemo(() => {
    let list = jobRoles;

    // 专业群筛选（精确匹配 major_group 字段）
    if (majorFilter !== 'all') {
      list = list.filter((j) => j.major_group === majorFilter);
    }

    // 搜索关键词
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.industry.toLowerCase().includes(q) ||
          j.skills_required.some((s) => s.toLowerCase().includes(q)) ||
          j.recommended_majors.some((m) => m.toLowerCase().includes(q))
      );
    }

    return list;
  }, [query, majorFilter]);

  return (
    <div className="min-h-full bg-background pb-4">
      {/* 顶部标题 */}
      <div className="bg-gradient-primary px-4 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-white/80 shrink-0" />
          <h2 className="text-base font-bold text-white">发现岗位</h2>
        </div>
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" />
          <Input
            placeholder="搜索岗位、技能、专业..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 pr-8 h-10 text-sm bg-white/15 border-white/25 text-white placeholder:text-white/55 focus-visible:ring-white/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
          )}
        </div>

        {/* 专业筛选 Chip 行（水平滚动） */}
        <div className="overflow-x-auto whitespace-nowrap pb-1 -mx-4 px-4 mt-3">
          <div className="inline-flex gap-2">
            {MAJOR_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setMajorFilter(f.value)}
                className={cn(
                  'inline-flex items-center h-7 px-3 rounded-full text-xs font-medium border transition-colors shrink-0',
                  majorFilter === f.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white/15 text-white/85 border-white/30 hover:bg-white/25'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 结果区 */}
      <div className="px-4 mt-3">
        {/* 结果数 */}
        <p className="text-xs text-muted-foreground mb-3">
          {query ? `搜索"${query}"` : majorFilter !== 'all' ? `${MAJOR_FILTERS.find(f => f.value === majorFilter)?.label}岗位` : '热门岗位'} · 共 {filtered.length} 个
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Search className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground text-center">未找到相关岗位</p>
            <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setMajorFilter('all'); }} className="text-primary">
              清除筛选
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => {
              const Icon = ICON_MAP[job.icon] || Code2;
              const isTarget = student?.target_role === job.title;

              return (
                <Card
                  key={job.id}
                  className={cn(
                    'shadow-card border transition-colors cursor-pointer active:scale-[0.99]',
                    isTarget ? 'border-primary/40 bg-accent/30' : 'border-border'
                  )}
                  onClick={() => setDetailJob(job)}
                >
                  <CardContent className="p-4">
                    {/* 头部 */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        isTarget ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-foreground text-balance">{job.title}</h3>
                          {isTarget && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-primary text-primary-foreground">我的目标</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{job.industry}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-2 py-0.5 shrink-0', LEVEL_COLORS[job.required_level_num] ?? 'border-border')}
                      >
                        {job.required_level}
                      </Badge>
                    </div>

                    {/* 技能等级区间 + 岗位描述 */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 shrink-0" />
                        {job.level_range}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 text-pretty line-clamp-2">
                      {job.description}
                    </p>

                    {/* 薪资 & 专业 */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-success font-semibold">
                        <Banknote className="w-3.5 h-3.5 shrink-0" />
                        {job.avg_salary}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                        {job.recommended_majors.slice(0, 2).join(' / ')}
                      </div>
                    </div>

                    {/* 技能标签 */}
                    <div className="flex flex-wrap gap-1">
                      {job.skills_required.slice(0, 5).map((skill) => {
                        const owned = student?.skills.some(
                          (s) => s.toLowerCase() === skill.toLowerCase()
                        );
                        return (
                          <span
                            key={skill}
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                              owned
                                ? 'bg-success/10 text-success border-success/30'
                                : 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            {skill}
                            {owned && ' ✓'}
                          </span>
                        );
                      })}
                      {job.skills_required.length > 5 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          +{job.skills_required.length - 5}
                        </span>
                      )}
                    </div>

                    {/* 底部操作 */}
                    {!isTarget && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-8 text-xs text-primary hover:text-primary hover:bg-accent"
                          onClick={(e) => { e.stopPropagation(); setActiveTab(1); }}
                        >
                          以此岗位生成路径
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 岗位详情弹窗 */}
      <Dialog open={!!detailJob} onOpenChange={(o) => { if (!o) setDetailJob(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[85dvh] overflow-y-auto">
          {detailJob && (() => {
            const Icon = ICON_MAP[detailJob.icon] || Code2;
            const isTarget = student?.target_role === detailJob.title;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                      isTarget ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-base font-bold text-balance leading-snug">
                        {detailJob.title}
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{detailJob.industry}</p>
                    </div>
                  </div>
                </DialogHeader>

                {/* 薪资（大号） */}
                <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-success/8 border border-success/20">
                  <Banknote className="w-4 h-4 text-success shrink-0" />
                  <span className="text-base font-bold text-success">{detailJob.avg_salary}</span>
                </div>

                {/* 技能等级 & 推荐专业 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground shrink-0">等级区间：</span>
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                      {detailJob.level_range}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground shrink-0">目标等级：</span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', LEVEL_COLORS[detailJob.required_level_num] ?? 'border-border')}
                    >
                      {detailJob.required_level}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">推荐专业：</span>
                    <div className="flex flex-wrap gap-1">
                      {detailJob.recommended_majors.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs font-normal">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 岗位描述 */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    岗位职责
                  </p>
                  <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                    {detailJob.description}
                  </p>
                </div>

                {/* 核心技能标签 */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    核心技能要求
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailJob.skills_required.map((skill) => {
                      const owned = student?.skills.some(
                        (s) => s.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <span
                          key={skill}
                          className={cn(
                            'text-xs px-2.5 py-1 rounded-full border font-medium',
                            owned
                              ? 'bg-success/10 text-success border-success/30'
                              : 'bg-muted text-muted-foreground border-border'
                          )}
                        >
                          {skill}{owned && ' ✓'}
                        </span>
                      );
                    })}
                  </div>
                  {student && (
                    <p className="text-xs text-muted-foreground mt-2">
                      已掌握 <span className="text-success font-semibold">
                        {detailJob.skills_required.filter((s) =>
                          student.skills.some((sk) => sk.toLowerCase() === s.toLowerCase())
                        ).length}
                      </span> / {detailJob.skills_required.length} 项技能
                    </p>
                  )}
                </div>

                {/* 企业招聘洞察面板 */}
                <CompanyHiringPanel jobTitle={detailJob.title} />

                {/* 底部按钮 */}
                {!isTarget && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      setDetailJob(null);
                      prefillTargetRole(detailJob.title);
                    }}
                  >
                    以此为目标的引导
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                {isTarget && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary font-medium">
                    <span>已是你的目标岗位</span>
                  </div>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscoverPage;
