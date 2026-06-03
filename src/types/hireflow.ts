// HireFlow 候选人评估 - 类型定义
// 与 src/types/types.ts (default brand) 解耦，独立演进

/** 5 维胜任力（与 HireFlow_候选人雷达 对齐） */
export type CompetencyDimension =
  | 'professional'   // 专业能力
  | 'learning'       // 学习能力
  | 'communication'  // 沟通能力
  | 'resilience'     // 抗压能力
  | 'leadership';    // 领导力

/** 胜任力评分（每个维度 0-100） */
export type CompetencyScores = Record<CompetencyDimension, number>;

/** 维度元数据（UI 展示用） */
export interface CompetencyMeta {
  key: CompetencyDimension;
  name: string;
  description: string;
  weight: number; // 权重 0-1（按岗位类型动态加权）
}

/** 面试阶段 */
export type InterviewStage =
  | 'initial'    // 初筛
  | 'technical'  // 技术面
  | 'final'      // 终面
  | 'offer'      // 已发 offer
  | 'rejected';  // 已拒绝

/** 候选人 */
export interface Candidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  target_position: string;
  experience_years: number;
  interview_stage: InterviewStage;
  competency_scores?: CompetencyScores;
  overall_match_rate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** 岗位胜任力要求 */
export interface PositionRequirement {
  position: string;
  required: CompetencyScores; // 每维度要求的最低分
  weights: CompetencyScores;  // 每维度的相对权重（自动归一化）
}

/** 单条结构化答题记录 */
export interface AssessmentAnswer {
  question_id: string;
  dimension: CompetencyDimension;
  question: string;
  answer: string;
  /** 0-100 的评分（由评估算法 / AI / 面试官给出） */
  score: number;
  source: 'self' | 'ai' | 'interviewer';
}

/** 评估记录 */
export interface Assessment {
  id: string;
  candidate_id: string;
  assessor_id?: string;
  job_position_id?: string;
  stage: InterviewStage;
  answers: AssessmentAnswer[];
  ai_dialogue_summary?: string;
  pdf_report_url?: string;
  scores: CompetencyScores;
  match_rate: number; // 0-100
  recommendation: 'strong_hire' | 'hire' | 'on_hold' | 'no_hire';
  created_at: string;
}

/** 胜任力 Gap（用于雷达图叠加） */
export interface CompetencyGap {
  dimension: CompetencyDimension;
  current: number;
  required: number;
  gap: number; // required - current（>0 表示缺口）
  severity: 'critical' | 'moderate' | 'minor' | 'none';
}

/** 评估问卷向导表单 */
export interface HireflowWizardFormData {
  // 步骤 1: 基本信息
  name: string;
  email: string;
  phone: string;

  // 步骤 2: 工作经历
  experience_years: number;
  current_role?: string;
  current_company?: string;

  // 步骤 3: 目标岗位
  target_position: string;

  // 步骤 4: 自评（5 个维度滑块 0-100）
  self_assessment: CompetencyScores;

  // 步骤 5: 案例题 / AI 对话备注
  case_answers: Array<{
    dimension: CompetencyDimension;
    answer: string;
  }>;
}
