/**
 * HireFlow brand - 顶层路由容器
 * - 包装 AuthGate（HR 评估涉及候选人 PII，强制登录；Supabase 未配置时允许访客）
 * - 切换 Home / Wizard
 * - onComplete：若 Supabase 可用且已登录 → 一次性写 candidate + assessment；
 *   否则降级到本地内存（仅 candidate，assessment 不持久化）
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AuthGate from '@/components/AuthGate';
import HireflowHome, { MOCK_CANDIDATES } from './AssessmentHome';
import HireflowWizard, { type WizardCompletion } from './AssessmentWizard';
import type { Candidate } from '@/types/hireflow';
import { logEvent, captureException } from '@/lib/observability';
import {
  getCurrentAssessorId,
  isSupabaseAvailable,
  persistCandidateWithAssessment,
} from '@/services/hireflowDB';

type View = 'home' | 'wizard';

function HireflowInner() {
  const [view, setView] = useState<View>('home');
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
  const queryClient = useQueryClient();

  const handleComplete = async (result: WizardCompletion) => {
    const { candidate: c, assessment } = result;
    logEvent('hireflow.candidate.created', {
      id: c.id,
      position: c.target_position,
      match_rate: c.overall_match_rate,
    });

    // 优先写 Supabase（已登录场景）
    if (isSupabaseAvailable()) {
      const assessorId = await getCurrentAssessorId();
      if (assessorId) {
        try {
          // 一次性写 candidate + assessment
          const { candidate: persisted, assessment: persistedA } =
            await persistCandidateWithAssessment(
              {
                name: c.name,
                email: c.email,
                phone: c.phone,
                target_position: c.target_position,
                experience_years: c.experience_years,
                interview_stage: c.interview_stage,
                competency_scores: c.competency_scores,
                overall_match_rate: c.overall_match_rate,
                notes: c.notes,
              },
              assessment,
              assessorId,
            );
          toast.success('已保存到 Supabase', {
            description: `${persisted.name} · ${persisted.target_position} · 匹配 ${Math.round(persistedA.match_rate)}%`,
          });
          queryClient.invalidateQueries({ queryKey: ['hireflow-candidates'] });
          setView('home');
          return;
        } catch (e) {
          captureException(e, { stage: 'hireflow.persist' });
          toast.error('写入 Supabase 失败，已保留为本地候选人', {
            description: e instanceof Error ? e.message : '未知错误',
          });
          // 失败时降级到本地
        }
      }
    }

    // 未登录 / 未配置 / 失败 → 本地内存（仅 candidate）
    setCandidates((list) => [c, ...list]);
    toast.success('候选人评估已完成', { description: '当前为本地内存模式' });
    setView('home');
  };

  if (view === 'wizard') {
    return (
      <HireflowWizard
        onComplete={handleComplete}
        onCancel={() => setView('home')}
      />
    );
  }

  return (
    <HireflowHome
      candidates={candidates}
      onStartNew={() => {
        logEvent('hireflow.wizard.start');
        setView('wizard');
      }}
    />
  );
}

export default function HireflowIndex() {
  return (
    <AuthGate required>
      <HireflowInner />
    </AuthGate>
  );
}
