/**
 * Campus brand - 校园智能助手首页
 * 四个区块：
 *   - 学生信息卡（含头像）
 *   - 今日课表
 *   - 校园通知
 *   - 校园服务入口
 * 全部组件都有 mock fallback，确保未接入后端时仍可演示
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Calendar,
  Sparkles,
  GraduationCap,
  Heart,
  Wallet,
  BookMarked,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { brand } from '@/config';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import UserMenu from '@/components/UserMenu';
import CampusQAPanel from './CampusQAPanel';
import {
  fetchCampusMe,
  fetchCampusNotices,
  fetchSchedule,
  fetchCampusServices,
  type CampusStudent,
  type CampusNotice,
  type ScheduleEntry,
  type CampusService,
} from '@/services/campusAPI';

interface Props {
  onOpenSchedule?: () => void;
  onOpenServices?: () => void;
}

const MOCK_ME: CampusStudent = {
  id: 's-001',
  name: '李同学',
  student_no: '20240001',
  major: '软件技术',
  grade: '大二',
  class_name: '软件 2401',
  campus: '主校区',
};

const MOCK_NOTICES: CampusNotice[] = [
  {
    id: 'n-1',
    title: '关于 2024-2025 学年第一学期期末考试安排',
    summary: '请同学们注意：本学期期末考试将于下周一开始，请按时参加。',
    source: '教务处',
    category: 'academic',
    published_at: '2024-12-20T09:00:00Z',
  },
  {
    id: 'n-2',
    title: '校园招聘会预告：12 月 25 日',
    summary: '本周三在学生活动中心举办校园招聘会，30+ 家企业参加。',
    source: '就业中心',
    category: 'activity',
    published_at: '2024-12-19T14:00:00Z',
  },
  {
    id: 'n-3',
    title: '宿舍水电费缴纳提醒',
    summary: '请于本月 28 日前完成水电费缴纳，逾期将影响热水使用。',
    source: '后勤处',
    category: 'admin',
    published_at: '2024-12-18T08:00:00Z',
  },
];

const MOCK_SCHEDULE: ScheduleEntry[] = [
  {
    id: 'sch-1',
    course: '数据库系统原理',
    teacher: '张教授',
    location: '教 A201',
    weekday: 1,
    start_time: '08:30',
    end_time: '10:05',
    weeks: '1-16',
  },
  {
    id: 'sch-2',
    course: 'Spring Boot 实战',
    teacher: '李讲师',
    location: '实验楼 305',
    weekday: 1,
    start_time: '10:25',
    end_time: '12:00',
    weeks: '1-16',
  },
  {
    id: 'sch-3',
    course: '英语口语',
    teacher: 'Smith',
    location: '语言中心 B12',
    weekday: 1,
    start_time: '14:00',
    end_time: '15:35',
    weeks: '1-12',
  },
];

const MOCK_SERVICES: CampusService[] = [
  { id: 'sv-1', name: '选课系统', category: 'academic', description: '查看可选课程并报名' },
  { id: 'sv-2', name: '考勤查询', category: 'academic', description: '本学期出勤记录' },
  { id: 'sv-3', name: '一卡通充值', category: 'finance', description: '余额查询与充值' },
  { id: 'sv-4', name: '宿舍报修', category: 'life', description: '水电网络故障申报' },
  { id: 'sv-5', name: '健康打卡', category: 'health', description: '体温与症状自报' },
  { id: 'sv-6', name: '图书借阅', category: 'academic', description: '查询馆藏与续借' },
];

const noticeIcon = {
  academic: BookMarked,
  activity: Sparkles,
  admin: Bell,
  urgent: Bell,
};

const noticeColor = {
  academic: 'bg-blue-100 text-blue-800 border-blue-200',
  activity: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-amber-100 text-amber-800 border-amber-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

const serviceIcon: Record<CampusService['category'], typeof Bell> = {
  academic: GraduationCap,
  life: Heart,
  finance: Wallet,
  health: Heart,
};

const weekdayLabel = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function CampusHome({ onOpenSchedule, onOpenServices }: Props) {
  const [showQA, setShowQA] = useState(false);

  const meQ = useQuery({ queryKey: ['campus-me'], queryFn: fetchCampusMe, retry: 0 });
  const noticesQ = useQuery({
    queryKey: ['campus-notices'],
    queryFn: () => fetchCampusNotices(20),
    retry: 0,
  });
  const scheduleQ = useQuery({
    queryKey: ['campus-schedule'],
    queryFn: () => fetchSchedule(),
    retry: 0,
  });
  const servicesQ = useQuery({
    queryKey: ['campus-services'],
    queryFn: fetchCampusServices,
    retry: 0,
  });

  const me: CampusStudent = meQ.data ?? MOCK_ME;
  const notices: CampusNotice[] = noticesQ.data ?? MOCK_NOTICES;
  const schedule: ScheduleEntry[] = scheduleQ.data ?? MOCK_SCHEDULE;
  const services: CampusService[] = servicesQ.data ?? MOCK_SERVICES;

  const usingMock = !meQ.data || !noticesQ.data || !scheduleQ.data || !servicesQ.data;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <header className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-12 ring-2 ring-white/30 flex-shrink-0">
                <AvatarFallback className="bg-white/20 text-primary-foreground">
                  {me.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">{me.name}</div>
                <div className="text-xs opacity-90 truncate">
                  {me.major} · {me.grade} · {me.class_name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {usingMock && (
                <Badge variant="outline" className="bg-white/10 text-white border-white/30 gap-1">
                  <Activity className="size-3" />
                  演示
                </Badge>
              )}
              <LanguageToggle />
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">{brand.copy.heroTitle}</h1>
          <p className="text-sm opacity-90 mt-1">{brand.copy.heroSubtitle}</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 今日课表 */}
        <section className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  今日课表 ({schedule.length})
                </span>
                {onOpenSchedule && (
                  <Button variant="ghost" size="sm" onClick={onOpenSchedule} className="gap-1">
                    本周
                    <ChevronRight className="size-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {schedule.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">今日无课，好好休息～</p>
              ) : (
                schedule.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{s.course}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.teacher} · {s.location} · {weekdayLabel[s.weekday]} · 周次 {s.weeks}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {s.start_time}–{s.end_time}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 通知 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="size-4 text-primary" />
                校园通知
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-3">
                  {notices.map((n) => {
                    const Icon = noticeIcon[n.category] ?? Bell;
                    return (
                      <div key={n.id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={noticeColor[n.category]}>{n.source}</Badge>
                          <Icon className="size-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(n.published_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <div className="font-medium text-sm">{n.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{n.summary}</div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        {/* 校园服务 */}
        <section>
          <Card className="sticky top-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>校园服务</span>
                {onOpenServices && (
                  <Button variant="ghost" size="sm" onClick={onOpenServices} className="gap-1">
                    全部
                    <ChevronRight className="size-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {services.slice(0, 6).map((s) => {
                const Icon = serviceIcon[s.category];
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={onOpenServices}
                    className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <Icon className="size-6 text-primary" />
                    <span className="text-xs text-center">{s.name}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* 悬浮 AI 问答按钮 */}
      <Button
        className="fixed bottom-6 right-6 rounded-full size-14 shadow-lg gap-2"
        onClick={() => setShowQA((v) => !v)}
      >
        <Sparkles className="size-5" />
      </Button>

      {showQA && <CampusQAPanel onClose={() => setShowQA(false)} />}
    </div>
  );
}
