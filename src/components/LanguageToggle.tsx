/**
 * LanguageToggle - 切换 i18n locale 的下拉
 * 与 ThemeToggle 配套，用于 header 右上角
 */
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { t, useLocale, listLocales, type Locale } from '@/lib/i18n';

const LOCALE_LABEL: Record<Locale, string> = {
  zh: 'lang.zh',
  en: 'lang.en',
};

export default function LanguageToggle() {
  const [loc, set] = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('lang.toggle')}>
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {listLocales().map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => set(l)}
            className={loc === l ? 'font-semibold' : ''}
          >
            {t(LOCALE_LABEL[l])}
            {loc === l && <span className="ml-2 text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
