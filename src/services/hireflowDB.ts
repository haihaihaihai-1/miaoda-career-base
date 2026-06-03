/**
 * HireFlow 数据持久化 —— Supabase 客户端封装
 *
 * 表结构由 supabase/migrations/0001_hireflow.sql 创建
 * 所有读写经过 RLS 限制（assessor_id = auth.uid()）
 */
import { supabase } from '@/db/supabase';
import type {
  Assessment,
  AssessmentAnswer,
  Candidate,
  CompetencyScores,
  InterviewStage,
} from '@/types/hireflow';

export interface CandidateListItem extends Candidate {
  assessment_count?: number;
  latest_recommendation?: Assessment['recommendation'];
}

export interface CreateCandidateInput {
  name: string;
  email?: string;
  phone?: string;
  target_position: string;
  experience_years: number;
  interview_stage?: InterviewStage;
  competency_scores?: CompetencyScores;
  overall_match_rate?: number;
  notes?: string;
}

export interface CreateAssessmentInput {
  candidate_id: string;
  stage: InterviewStage;
  answers: AssessmentAnswer[];
  scores: CompetencyScores;
  match_rate: number;
  recommendation: Assessment['recommendation'];
  ai_dialogue_summary?: string;
  pdf_report_url?: string;
  job_position_id?: string;
}

/** 当前 supabase 客户端是否可用（URL 和 ANON_KEY 都已配置） */
export function isSupabaseAvailable(): boolean {
  return (
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
  );
}

// ============================================================================
// candidates
// ============================================================================

export async function listCandidates(limit = 100): Promise<CandidateListItem[]> {
  const { data, error } = await supabase
    .from('candidate_summary')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listCandidates: ${error.message}`);
  return (data ?? []) as CandidateListItem[];
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getCandidate: ${error.message}`);
  return (data ?? null) as Candidate | null;
}

export async function createCandidate(
  input: CreateCandidateInput,
  assessorId: string,
): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .insert([{ ...input, assessor_id: assessorId }])
    .select()
    .single();
  if (error) throw new Error(`createCandidate: ${error.message}`);
  return data as Candidate;
}

export async function updateCandidate(
  id: string,
  patch: Partial<CreateCandidateInput>,
): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`updateCandidate: ${error.message}`);
  return data as Candidate;
}

export async function deleteCandidate(id: string): Promise<void> {
  const { error } = await supabase.from('candidates').delete().eq('id', id);
  if (error) throw new Error(`deleteCandidate: ${error.message}`);
}

// ============================================================================
// assessments
// ============================================================================

export async function listCandidateAssessments(candidateId: string): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listCandidateAssessments: ${error.message}`);
  return (data ?? []) as Assessment[];
}

export async function createAssessment(
  input: CreateAssessmentInput,
  assessorId: string,
): Promise<Assessment> {
  const { data, error } = await supabase
    .from('assessments')
    .insert([{ ...input, assessor_id: assessorId }])
    .select()
    .single();
  if (error) throw new Error(`createAssessment: ${error.message}`);
  return data as Assessment;
}

/**
 * 一次性写入：先建 candidate（如果新候选人），再写一条 assessment，
 * 并把 candidate 的 competency_scores/overall_match_rate 回填
 */
export async function persistCandidateWithAssessment(
  candidateInput: CreateCandidateInput,
  assessmentExtras: Omit<CreateAssessmentInput, 'candidate_id'>,
  assessorId: string,
): Promise<{ candidate: Candidate; assessment: Assessment }> {
  const candidate = await createCandidate(
    {
      ...candidateInput,
      competency_scores: assessmentExtras.scores,
      overall_match_rate: assessmentExtras.match_rate,
    },
    assessorId,
  );
  const assessment = await createAssessment(
    { ...assessmentExtras, candidate_id: candidate.id },
    assessorId,
  );
  return { candidate, assessment };
}

// ============================================================================
// auth helper —— 用于获取当前 assessor_id（实际使用 supabase auth）
// ============================================================================

export async function getCurrentAssessorId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}
