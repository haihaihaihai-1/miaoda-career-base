// Dify API 服务层
// 封装与 Dify 工作流 API 的所有交互（POST /workflows/run）

import type { Student, CareerPath, GapItem } from '@/types/types';

// ---- TypeScript 接口定义 ----

/** 学生档案（Dify 输入格式） */
export interface StudentProfile {
  name: string;
  education: string;
  major: string;
  grade: string;
  skills: string[];
  background: string[];
  career_interest: string[];
  target_role: string;
  learning_goal: string;
  daily_hours: string;
  study_period: string;
}

/** 能力差距分析结果（Dify 输出格式） */
export interface GapAnalysisResult {
  target_role: string;
  current_skills: string[];
  missing_skills: string[];
  gap_items: GapItem[];
  dimensions: {
    programming: number;
    database: number;
    framework: number;
    project: number;
    soft_skills: number;
  };
  match_rate: number;
  priority_suggestions: string[];
}

/** 进度更新请求 */
export interface ProgressUpdateRequest {
  student_name: string;
  milestone_id: number;
  status: 'current' | 'completed' | 'upcoming';
  progress: number;
  completed_at?: string;
}

// ---- 基础请求工具 ----

const getBaseUrl = () => (import.meta.env.VITE_DIFY_API_URL as string | undefined)?.replace(/\/$/, '');
const getApiKey = () => import.meta.env.VITE_DIFY_API_KEY as string | undefined;

/** 是否已配置 Dify */
export const isDifyConfigured = (): boolean => {
  const url = getBaseUrl();
  const key = getApiKey();
  return Boolean(url && key && url.length > 0 && key.length > 0);
};

/**
 * 调用 Dify 工作流（POST /workflows/run）
 * 返回 outputs 字段内容
 */
async function runDifyWorkflow<T>(inputs: Record<string, unknown>, user: string): Promise<T> {
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey();

  if (!baseUrl || !apiKey) {
    throw new Error('Dify API 配置缺失：请在 .env 中设置 VITE_DIFY_API_URL 和 VITE_DIFY_API_KEY');
  }

  const url = `${baseUrl}/workflows/run`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs,
      response_mode: 'blocking',
      user,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Dify API 请求失败 [${response.status}]: ${errorText}`);
  }

  const json = await response.json();
  // Dify 工作流响应结构：{ data: { outputs: {...} } }
  const outputs = json?.data?.outputs ?? json?.outputs ?? json;
  return outputs as T;
}

// ---- 导出的业务函数 ----

/**
 * 节点1 - 画像采集
 * inputs: { query: "学生信息JSON字符串" }
 */
export async function collectStudentProfile(
  profile: StudentProfile
): Promise<{ profile_id: string; summary?: string }> {
  return runDifyWorkflow<{ profile_id: string; summary?: string }>(
    { query: JSON.stringify(profile) },
    profile.name
  );
}

/**
 * 节点2 - 差距分析
 * inputs: { student_info, target_role, skills, current_level }
 */
export async function analyzeSkillGap(
  profile: StudentProfile,
  currentLevel: number
): Promise<GapAnalysisResult> {
  return runDifyWorkflow<GapAnalysisResult>(
    {
      student_info: JSON.stringify(profile),
      target_role: profile.target_role,
      skills: profile.skills,
      current_level: currentLevel,
    },
    profile.name
  );
}

/**
 * 节点4 - 路径生成
 * inputs: { student_profile, gap_analysis, courses }
 */
export async function generatePathFromDify(
  profile: StudentProfile,
  gapAnalysis: GapAnalysisResult,
  courseIds: string[]
): Promise<CareerPath> {
  return runDifyWorkflow<CareerPath>(
    {
      student_profile: JSON.stringify(profile),
      gap_analysis: JSON.stringify(gapAnalysis),
      courses: courseIds,
    },
    profile.name
  );
}

/**
 * 进度回传
 */
export async function updateProgress(update: ProgressUpdateRequest): Promise<{ updated: boolean }> {
  return runDifyWorkflow<{ updated: boolean }>(
    {
      ...update,
      completed_at: update.completed_at ?? new Date().toISOString(),
    },
    update.student_name
  );
}
