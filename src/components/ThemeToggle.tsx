/**
 * 暗黑模式切换 - 不引入 next-themes（避免额外依赖）
 * 通过 document.documentElement classList + localStorage 实现
 *
 * 用法：
 *   <ThemeToggle />
 *   或在代码里：setTheme('dark') / setTheme('light') / setTheme('system')
 */
import { useEffect, useState } from 'react';
import { Moon, Sun, MonitorCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { t } from '@/lib/i18n';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'miaoda-theme';

function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
}

export function setTheme(theme: Theme): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme);
  }
  applyTheme(theme);
}

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return stored ?? 'system';
}

/** 初始化（建议在 main.tsx 调用，但本组件也会兜底应用一次） */
export function initTheme(): void {
  applyTheme(getTheme());

  // 跟随系统时实时响应
  if (typeof window !== 'undefined') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (getTheme() === 'system') applyTheme('system');
    });
  }
}

export default function ThemeToggle() {
  const [theme, setLocalTheme] = useState<Theme>(getTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const choose = (next: Theme) => {
    setTheme(next);
    setLocalTheme(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('theme.toggle')}>
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => choose('light')}>
          <Sun className="mr-2 size-4" />
          {t('theme.light')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => choose('dark')}>
          <Moon className="mr-2 size-4" />
          {t('theme.dark')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => choose('system')}>
          <MonitorCog className="mr-2 size-4" />
          {t('theme.system')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
