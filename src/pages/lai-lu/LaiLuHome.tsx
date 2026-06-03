/**
 * Lai-Lu brand - 占位首页
 * 实际业务待对齐；当前作为可演示骨架
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Compass, Activity } from 'lucide-react';
import { brand } from '@/config';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import UserMenu from '@/components/UserMenu';

const FEATURES = [
  { icon: Sparkles, title: 'AI 助手', desc: '理解你的意图，主动给出方案' },
  { icon: Zap, title: '工作流自动化', desc: '把重复任务交给 Lai-Lu' },
  { icon: Compass, title: '智能导航', desc: '一句话穿越复杂系统' },
];

export default function LaiLuHome() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl flex items-center justify-center bg-primary text-primary-foreground font-bold flex-shrink-0">
              L
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{brand.name}</h1>
              <p className="text-xs text-muted-foreground truncate">{brand.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="outline" className="gap-1 hidden sm:inline-flex">
              <Activity className="size-3" />
              占位骨架
            </Badge>
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <section className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{brand.copy.heroTitle}</h2>
          <p className="text-lg text-muted-foreground mb-8">{brand.copy.heroSubtitle}</p>
          <Button size="lg" className="gap-2">
            <Sparkles className="size-4" />
            {brand.copy.ctaPrimary}
          </Button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <f.icon className="size-5 text-primary" />
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="max-w-3xl mx-auto mt-16 text-center">
          <Card className="bg-muted/40">
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground">
                此为 Lai-Lu brand 的占位首页。等业务负责人对齐目标用户与核心场景后，
                将由 `derivatives/lai-lu/SPEC.md` 驱动实施真实功能。
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
