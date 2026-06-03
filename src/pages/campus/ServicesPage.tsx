/**
 * Campus brand - 校园服务一览
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  GraduationCap,
  Heart,
  Wallet,
  BookMarked,
  Coffee,
} from 'lucide-react';
import { fetchCampusServices, type CampusService } from '@/services/campusAPI';

interface Props {
  onBack: () => void;
}

const MOCK_SERVICES: CampusService[] = [
  { id: 'sv-1', name: '选课系统', category: 'academic', description: '查看可选课程并报名' },
  { id: 'sv-2', name: '考勤查询', category: 'academic', description: '本学期出勤记录' },
  { id: 'sv-3', name: '成绩单', category: 'academic', description: '本学期/历史成绩查询' },
  { id: 'sv-4', name: '一卡通充值', category: 'finance', description: '余额查询与充值' },
  { id: 'sv-5', name: '宿舍报修', category: 'life', description: '水电网络故障申报' },
  { id: 'sv-6', name: '健康打卡', category: 'health', description: '体温与症状自报' },
  { id: 'sv-7', name: '图书借阅', category: 'academic', description: '查询馆藏与续借' },
  { id: 'sv-8', name: '食堂菜单', category: 'life', description: '今日菜单与营养信息' },
  { id: 'sv-9', name: '校园地图', category: 'life', description: '建筑、教室、交通' },
  { id: 'sv-10', name: '医务室预约', category: 'health', description: '校医院挂号' },
  { id: 'sv-11', name: '奖学金申请', category: 'finance', description: '本学期可申请奖学金' },
  { id: 'sv-12', name: '心理咨询', category: 'health', description: '一对一咨询预约' },
];

const categoryMeta = {
  academic: { label: '学业', icon: GraduationCap, color: 'bg-blue-100 text-blue-800' },
  life: { label: '生活', icon: Coffee, color: 'bg-amber-100 text-amber-800' },
  finance: { label: '财务', icon: Wallet, color: 'bg-purple-100 text-purple-800' },
  health: { label: '健康', icon: Heart, color: 'bg-pink-100 text-pink-800' },
} as const;

export default function ServicesPage({ onBack }: Props) {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<CampusService['category'] | 'all'>('all');

  const q = useQuery({
    queryKey: ['campus-services-all'],
    queryFn: fetchCampusServices,
    retry: 0,
  });

  const services: CampusService[] = q.data ?? MOCK_SERVICES;

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return services.filter((s) => {
      if (activeCat !== 'all' && s.category !== activeCat) return false;
      if (!lower) return true;
      return (
        s.name.toLowerCase().includes(lower) || s.description.toLowerCase().includes(lower)
      );
    });
  }, [services, search, activeCat]);

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <BookMarked className="size-5 text-primary" />
              校园服务
            </h1>
            <p className="text-xs text-muted-foreground">{services.length} 项服务</p>
          </div>
        </div>
        <div className="container mx-auto px-6 pb-3 flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索服务名称..."
              className="pl-8 h-9"
            />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={activeCat === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveCat('all')}
            >
              全部
            </Button>
            {(Object.keys(categoryMeta) as Array<keyof typeof categoryMeta>).map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={activeCat === cat ? 'default' : 'outline'}
                onClick={() => setActiveCat(cat)}
              >
                {categoryMeta[cat].label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">没有找到匹配的服务</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((s) => {
              const meta = categoryMeta[s.category];
              const Icon = meta.icon;
              return (
                <Card key={s.id} className="hover:border-primary cursor-pointer transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-start gap-2">
                      <Icon className="size-5 text-primary flex-shrink-0" />
                      <span>{s.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                    <Badge className={`${meta.color} mt-2 text-xs`}>{meta.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
