/**
 * NetworkStatusBanner - 在 navigator.onLine 变 false 时显示离线提示带
 * 不强制覆盖页面，只在 header 下方插入一条横条
 */
import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

interface Props {
  className?: string;
}

export default function NetworkStatusBanner({ className }: Props) {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [recentlyChanged, setRecentlyChanged] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => {
      setOnline(true);
      setRecentlyChanged(true);
      setTimeout(() => setRecentlyChanged(false), 3000);
    };
    const onOffline = () => {
      setOnline(false);
      setRecentlyChanged(true);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online && !recentlyChanged) return null;

  const isOffline = !online;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'text-xs px-4 py-1.5 flex items-center justify-center gap-2 transition-colors',
        isOffline ? 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100' : 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
        className,
      )}
    >
      {isOffline ? <WifiOff className="size-3" /> : <Wifi className="size-3" />}
      <span>{isOffline ? t('network.offline') : t('network.online')}</span>
    </div>
  );
}
