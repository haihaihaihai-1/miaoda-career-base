// 1+X 证书报名提醒 Banner — 首页顶部，进度达 30% 时首次弹出
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { CareerPath, Milestone } from '@/types/types';

const NOTIFIED_KEY = 'cert_notified_ids';

interface Props {
  careerPath: CareerPath | null;
  milestones: Milestone[];
}

interface CertAlert {
  id: string;
  name: string;
}

const getNotified = (): Set<string> => {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
};

const markNotified = (id: string) => {
  const set = getNotified();
  set.add(id);
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
};

/** 计算某证书当前进度（0-1）：completed=100%，current=60%，全upcoming=0% */
const calcCertProgress = (certName: string, milestones: Milestone[], careerPath: CareerPath): number => {
  // 找到此证书所属 stage
  let certStage = 0;
  careerPath.stages.forEach((s) => {
    if (s.certificates.includes(certName)) certStage = s.stage;
  });
  if (!certStage) return 0;

  const stageMilestones = milestones.filter((m) => m.stage <= certStage);
  if (!stageMilestones.length) return 0;

  // 按需求：completed=100%, current=60%, 全为upcoming=0%
  const hasCompleted = stageMilestones.some((m) => m.status === 'completed');
  const hasCurrent = stageMilestones.some((m) => m.status === 'current');
  if (hasCompleted) return 1.0;
  if (hasCurrent) return 0.6;
  return 0;
};

const CertBanner: React.FC<Props> = ({ careerPath, milestones }) => {
  const [queue, setQueue] = useState<CertAlert[]>([]);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [current, setCurrent] = useState<CertAlert | null>(null);

  // 检测需要提醒的证书
  useEffect(() => {
    if (!careerPath || !milestones.length) return;
    const notified = getNotified();
    const toAlert: CertAlert[] = [];

    careerPath.stages.forEach((stage) => {
      stage.certificates.forEach((cert) => {
        const id = `${stage.stage}-${cert}`;
        if (notified.has(id)) return;
        const progress = calcCertProgress(cert, milestones, careerPath);
        if (progress >= 0.3) {
          toAlert.push({ id, name: cert });
        }
      });
    });

    if (toAlert.length) setQueue(toAlert);
  }, [careerPath, milestones]);

  // 逐条展示
  const dismiss = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setFading(false);
      setVisible(false);
      setCurrent(null);
      setQueue((q) => q.slice(1));
    }, 400);
  }, []);

  useEffect(() => {
    if (!visible && queue.length > 0) {
      const next = queue[0];
      markNotified(next.id);
      setCurrent(next);
      setVisible(true);
      const timer = setTimeout(dismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [queue, visible, dismiss]);

  if (!visible || !current) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-2 transition-opacity duration-400',
        fading ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="w-full max-w-md bg-primary text-primary-foreground rounded-xl shadow-lg px-4 py-3 flex items-start gap-3">
        <span className="text-base leading-none mt-0.5 shrink-0">📋</span>
        <p className="text-xs leading-relaxed flex-1 min-w-0">
          <strong>{current.name}</strong> 已达到可报名状态，建议关注近期考试安排
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-primary-foreground/70 hover:text-primary-foreground text-base leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default CertBanner;
