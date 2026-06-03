// 企业招聘洞察面板 — 嵌入岗位详情弹窗，依托 company-hiring-data 插件
import { useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Search, Building2, Banknote, MapPin, Users, Briefcase,
  ChevronDown, ChevronUp, TrendingUp, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── 类型定义 ──────────────────────────────────────────────────────────────

interface HireOverview {
  titleKw: string;
  titleType: string;
  city: string;
  src: string;
  titleLevel: string;
  avgSal: string;
  titleCnt: number;
  titleModifyDate: string;
  cityCnt: number;
}

interface KvItem { key: string; value: number; }

interface HireStatistics {
  companyName: string;
  avgSal: number;
  avgSalStr: string;
  priProvince: string;
  zpnumber: number;
  bkEducation: string;
  btw3and5Years: string;
  educationList: KvItem[];
  salaryList: KvItem[];
  yearsList: KvItem[];
  recruitPosition: string[];
  zpnumberList: KvItem[];
  ssNumHisList: KvItem[];
}

// ─── 辅助工具 ──────────────────────────────────────────────────────────────

/** 元薪资→万/年格式化 */
function fmtAvgSal(val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num <= 0) return '—';
  const monthly = num;
  const yearly = (monthly * 12 / 10000).toFixed(1);
  return `${yearly}万/年`;
}

const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

// ─── 子组件：骨架屏 ────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-xl bg-muted" />
      <Skeleton className="h-32 rounded-xl bg-muted" />
    </div>
  );
}

// ─── 子组件：数据统计图表 ──────────────────────────────────────────────────

interface StatChartProps {
  title: string;
  data: KvItem[];
  icon: React.ReactNode;
}

function StatChart({ title, data, icon }: StatChartProps) {
  if (!data || data.length === 0) return null;
  // 按 value 降序，截取前 6 条
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 6);
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
        {icon}
        {title}
      </p>
      <div className="w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="key"
              width={72}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v: number) => [`${v} 人`, '数量']}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {sorted.map((_, idx) => (
                <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 子组件：月度趋势迷你图 ────────────────────────────────────────────────

function MonthlyTrendChart({ data }: { data: KvItem[] }) {
  if (!data || data.length === 0) return null;
  // 取最近12个月，按时间升序
  const sorted = [...data]
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12);
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
        近期月度招聘趋势
      </p>
      <div className="w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={sorted} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <XAxis
              dataKey="key"
              tick={{ fontSize: 9 }}
              tickFormatter={(v: string) => v.slice(5)} // 只显示 MM
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(v: number) => [`${v}`, '招聘量']}
              labelFormatter={(l: string) => l}
              contentStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 主组件 ────────────────────────────────────────────────────────────────

interface CompanyHiringPanelProps {
  /** 当前岗位标题，用于在提示中展示 */
  jobTitle: string;
}

export function CompanyHiringPanel({ jobTitle }: CompanyHiringPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<HireOverview | null>(null);
  const [stats, setStats] = useState<HireStatistics | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const kw = keyword.trim();
    if (!kw) return;
    setLoading(true);
    setError(null);
    setOverview(null);
    setStats(null);
    setSearched(true);

    try {
      // 并行调用两个接口
      const [ovRes, stRes] = await Promise.allSettled([
        supabase.functions.invoke<{ code: number; msg: string; data: HireOverview }>('hire-overview', {
          body: { keyword: kw },
        }),
        supabase.functions.invoke<{ code: number; msg: string; data: HireStatistics }>('hire-statistics', {
          body: { keyword: kw },
        }),
      ]);

      // 处理概况接口
      if (ovRes.status === 'fulfilled') {
        const { data: ovData, error: ovErr } = ovRes.value;
        if (ovErr) {
          const msg = await ovErr?.context?.text?.().catch(() => ovErr.message);
          throw new Error(msg || '招聘概况查询失败');
        }
        if (ovData?.code === 200) setOverview(ovData.data);
        else if (ovData?.code === 201) setError('未查询到该企业招聘数据，请确认企业名称后重试');
        else throw new Error(ovData?.msg || '招聘概况查询失败');
      }

      // 处理统计接口
      if (stRes.status === 'fulfilled') {
        const { data: stData, error: stErr } = stRes.value;
        if (!stErr && stData?.code === 200) setStats(stData.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  return (
    <div className="rounded-xl border border-border bg-secondary/30">
      {/* 折叠标题栏 */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          企业招聘洞察
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">实时数据</Badge>
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {/* 可折叠内容区 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            输入企业名称，查看该企业在 <span className="text-primary font-medium">{jobTitle}</span> 方向的真实招聘数据
          </p>

          {/* 搜索栏 */}
          <div className="flex gap-2">
            <Input
              placeholder="如：华为技术有限公司"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-9 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <Button
              size="sm"
              className="h-9 px-3 shrink-0 gap-1.5"
              onClick={handleSearch}
              disabled={loading || !keyword.trim()}
            >
              <Search className="w-3.5 h-3.5" />
              查询
            </Button>
          </div>

          {/* 加载骨架 */}
          {loading && <PanelSkeleton />}

          {/* 错误提示 */}
          {!loading && error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* 无结果提示 */}
          {!loading && searched && !error && !overview && (
            <p className="text-xs text-muted-foreground text-center py-4">暂无招聘数据</p>
          )}

          {/* 概况卡片 */}
          {!loading && overview && (
            <div className="space-y-3">
              {/* 企业名 */}
              {stats?.companyName && (
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  {stats.companyName}
                </p>
              )}

              {/* 核心指标三宫格 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-card border border-border p-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center justify-center gap-0.5">
                    <Briefcase className="w-3 h-3 shrink-0" />职位数
                  </p>
                  <p className="text-lg font-bold text-primary leading-none">{overview.titleCnt}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">更新{overview.titleModifyDate}</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center justify-center gap-0.5">
                    <Banknote className="w-3 h-3 shrink-0" />均薪
                  </p>
                  <p className={cn(
                    'text-base font-bold leading-none',
                    stats?.avgSalStr ? 'text-success' : 'text-foreground'
                  )}>
                    {stats?.avgSalStr ?? fmtAvgSal(overview.avgSal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">月均</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1 flex items-center justify-center gap-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {stats?.priProvince ? '主要省份' : '城市'}
                  </p>
                  <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                    {stats?.priProvince ?? overview.city?.split('、')[0] ?? '—'}
                  </p>
                </div>
              </div>

              {/* 总量 & 招聘来源 */}
              <div className="flex flex-wrap gap-2 text-xs">
                {stats && (
                  <span className="flex items-center gap-1 bg-primary/8 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                    <Users className="w-3 h-3 shrink-0" />
                    累计招聘 {stats.zpnumber.toLocaleString()} 人
                  </span>
                )}
                {overview.src && overview.src.split('、').map((s) => (
                  <span key={s} className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                    {s}
                  </span>
                ))}
              </div>

              {/* 职位关键词 */}
              {overview.titleKw && overview.titleKw !== '其他' && (
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground shrink-0 pt-0.5">热门职位：</span>
                  {overview.titleKw.split('、').slice(0, 5).map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-[10px] font-normal">{kw}</Badge>
                  ))}
                </div>
              )}

              {/* 在招职位（来自统计接口） */}
              {stats?.recruitPosition && stats.recruitPosition.length > 0 && (
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground shrink-0 pt-0.5">在招岗位：</span>
                  {stats.recruitPosition.slice(0, 6).map((pos) => (
                    <span
                      key={pos}
                      className="text-[10px] px-2 py-0.5 bg-accent text-accent-foreground rounded-full border border-border"
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              )}

              {/* 图表区域（统计接口数据） */}
              {stats && (
                <div className="space-y-2">
                  <StatChart
                    title="学历分布"
                    data={stats.educationList}
                    icon={<Users className="w-3.5 h-3.5 text-primary shrink-0" />}
                  />
                  <StatChart
                    title="薪资区间"
                    data={stats.salaryList}
                    icon={<Banknote className="w-3.5 h-3.5 text-success shrink-0" />}
                  />
                  <StatChart
                    title="工作年限要求"
                    data={stats.yearsList}
                    icon={<Briefcase className="w-3.5 h-3.5 text-warning shrink-0" />}
                  />
                  <MonthlyTrendChart data={stats.zpnumberList} />
                </div>
              )}

              {/* 本科占比 & 3-5年占比徽标 */}
              {stats && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    本科+ <span className="font-semibold text-foreground">{stats.bkEducation}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    3-5年经验 <span className="font-semibold text-foreground">{stats.btw3and5Years}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
