/**
 * Campus brand - 周课表
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, User } from 'lucide-react';
import { fetchSchedule, type ScheduleEntry } from '@/services/campusAPI';

interface Props {
  onBack: () => void;
}

const MOCK_WEEK: ScheduleEntry[] = [
  { id: '1', course: '数据库系统', teacher: '张教授', location: '教 A201', weekday: 1, start_time: '08:30', end_time: '10:05', weeks: '1-16' },
  { id: '2', course: 'Spring Boot 实战', teacher: '李讲师', location: '实验楼 305', weekday: 1, start_time: '10:25', end_time: '12:00', weeks: '1-16' },
  { id: '3', course: '英语口语', teacher: 'Smith', location: '语言中心 B12', weekday: 1, start_time: '14:00', end_time: '15:35', weeks: '1-12' },
  { id: '4', course: '高数 II', teacher: '王教授', location: '教 C102', weekday: 2, start_time: '08:30', end_time: '10:05', weeks: '1-18' },
  { id: '5', course: '体育（篮球）', teacher: '刘老师', location: '体育馆', weekday: 3, start_time: '14:00', end_time: '15:35', weeks: '1-16' },
  { id: '6', course: '操作系统', teacher: '赵教授', location: '教 A305', weekday: 4, start_time: '10:25', end_time: '12:00', weeks: '1-16' },
  { id: '7', course: '软件工程', teacher: '钱教授', location: '教 A206', weekday: 5, start_time: '08:30', end_time: '10:05', weeks: '1-16' },
];

const WEEKDAYS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TIME_SLOTS = ['08:30', '10:25', '14:00', '15:55', '19:00'];

export default function SchedulePage({ onBack }: Props) {
  const q = useQuery({
    queryKey: ['campus-schedule-week'],
    queryFn: () => fetchSchedule(),
    retry: 0,
  });

  const entries: ScheduleEntry[] = q.data ?? MOCK_WEEK;

  /** 把 entries 按 weekday 分组 */
  const byDay = useMemo(() => {
    const m: Record<number, ScheduleEntry[]> = {};
    for (const e of entries) {
      (m[e.weekday] ??= []).push(e);
    }
    for (const d of Object.keys(m)) {
      m[+d].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return m;
  }, [entries]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              本周课表
            </h1>
            <p className="text-xs text-muted-foreground">{entries.length} 节课</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((d) => (
            <Card key={d} className={!byDay[d] ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {WEEKDAYS[d]}{' '}
                  <Badge variant="outline" className="ml-1 text-xs">
                    {(byDay[d] ?? []).length} 节
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(byDay[d] ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">无课</p>
                ) : (
                  byDay[d].map((e) => (
                    <div key={e.id} className="border rounded-lg p-2 hover:bg-accent transition-colors">
                      <div className="font-medium text-sm">{e.course}</div>
                      <div className="text-xs text-primary font-mono">
                        {e.start_time}–{e.end_time}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="size-3" />
                        {e.location}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="size-3" />
                        {e.teacher}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-xs text-muted-foreground text-center">
          时间段：{TIME_SLOTS.join(' / ')}
        </div>
      </main>
    </div>
  );
}
