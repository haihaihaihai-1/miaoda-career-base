/**
 * HireFlow brand - 胜任力评估算法
 *
 * 设计原则：
 *   - 纯函数，可单测
 *   - 答题分数按 source（self/ai/interviewer）加权后聚合
 *   - match_rate 用加权欧氏距离
 *   - critical gap 触发 decision 降级
 */
import type {
  AssessmentAnswer,
  CompetencyDimension,
  CompetencyGap,
  CompetencyMeta,
  CompetencyScores,
  PositionRequirement,
  Assessment,
} from '@/types/hireflow';

// ============================================================================
// 维度元数据
// ============================================================================

export const COMPETENCY_DIMENSIONS: CompetencyMeta[] = [
  {
    key: 'professional',
    name: '专业能力',
    description: '岗位所需硬技能、领域知识、实践经验深度',
    weight: 0.35,
  },
  {
    key: 'learning',
    name: '学习能力',
    description: '快速掌握新技术、面对陌生问题的迭代速度',
    weight: 0.20,
  },
  {
    key: 'communication',
    name: '沟通能力',
    description: '表达清晰度、跨职能协作、需求澄清',
    weight: 0.15,
  },
  {
    key: 'resilience',
    name: '抗压能力',
    description: '高压环境下的稳定性、情绪自我管理',
    weight: 0.10,
  },
  {
    key: 'leadership',
    name: '领导力',
    description: '影响他人、推动落地、跨团队对齐的能力',
    weight: 0.20,
  },
];

const DIMENSION_KEYS: CompetencyDimension[] = COMPETENCY_DIMENSIONS.map((d) => d.key);

// ============================================================================
// 内置岗位胜任力模板（可被 Supabase / dual_tower 覆盖）
// ============================================================================

export const POSITION_REQUIREMENTS: Record<string, PositionRequirement> = {
  'Senior Software Engineer': {
    position: 'Senior Software Engineer',
    required: {
      professional: 85,
      learning: 75,
      communication: 70,
      resilience: 70,
      leadership: 55,
    },
    weights: {
      professional: 0.40,
      learning: 0.20,
      communication: 0.15,
      resilience: 0.10,
      leadership: 0.15,
    },
  },
  'Tech Lead': {
    position: 'Tech Lead',
    required: {
      professional: 85,
      learning: 75,
      communication: 80,
      resilience: 75,
      leadership: 80,
    },
    weights: {
      professional: 0.25,
      learning: 0.15,
      communication: 0.20,
      resilience: 0.15,
      leadership: 0.25,
    },
  },
  'Engineering Manager': {
    position: 'Engineering Manager',
    required: {
      professional: 70,
      learning: 70,
      communication: 85,
      resilience: 80,
      leadership: 85,
    },
    weights: {
      professional: 0.15,
      learning: 0.15,
      communication: 0.25,
      resilience: 0.20,
      leadership: 0.25,
    },
  },
  'Junior Software Engineer': {
    position: 'Junior Software Engineer',
    required: {
      professional: 60,
      learning: 75,
      communication: 60,
      resilience: 60,
      leadership: 40,
    },
    weights: {
      professional: 0.30,
      learning: 0.30,
      communication: 0.15,
      resilience: 0.15,
      leadership: 0.10,
    },
  },
  'Product Manager': {
    position: 'Product Manager',
    required: {
      professional: 65,
      learning: 75,
      communication: 85,
      resilience: 75,
      leadership: 75,
    },
    weights: {
      professional: 0.15,
      learning: 0.15,
      communication: 0.25,
      resilience: 0.15,
      leadership: 0.30,
    },
  },
};

// ============================================================================
// 工具函数
// ============================================================================

/** 把分数 clamp 到 [0, 100] */
function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

/** 答题来源权重 */
const SOURCE_WEIGHT: Record<AssessmentAnswer['source'], number> = {
  self: 1.0,
  ai: 1.2,
  interviewer: 1.5,
};

/** 空 scores */
const ZERO_SCORES: CompetencyScores = {
  professional: 0,
  learning: 0,
  communication: 0,
  resilience: 0,
  leadership: 0,
};

/** 权重归一化（总和为 1；若全 0 返回均匀分布） */
export function normalizeWeights(weights: CompetencyScores): CompetencyScores {
  const sum = DIMENSION_KEYS.reduce((acc, k) => acc + (weights[k] || 0), 0);
  if (sum <= 0) {
    const uniform = 1 / DIMENSION_KEYS.length;
    return DIMENSION_KEYS.reduce<CompetencyScores>(
      (acc, k) => ({ ...acc, [k]: uniform }),
      { ...ZERO_SCORES },
    );
  }
  return DIMENSION_KEYS.reduce<CompetencyScores>(
    (acc, k) => ({ ...acc, [k]: (weights[k] || 0) / sum }),
    { ...ZERO_SCORES },
  );
}

// ============================================================================
// 核心算法
// ============================================================================

/** 把所有答题按维度加权聚合为 CompetencyScores */
export function calculateCompetencyScores(answers: AssessmentAnswer[]): CompetencyScores {
  const sumByDim: Record<CompetencyDimension, number> = { ...ZERO_SCORES };
  const wByDim: Record<CompetencyDimension, number> = { ...ZERO_SCORES };

  for (const a of answers) {
    const w = SOURCE_WEIGHT[a.source] ?? 1.0;
    const s = clamp01(a.score);
    sumByDim[a.dimension] += s * w;
    wByDim[a.dimension] += w;
  }

  const out: CompetencyScores = { ...ZERO_SCORES };
  for (const k of DIMENSION_KEYS) {
    out[k] = wByDim[k] > 0 ? Math.round(sumByDim[k] / wByDim[k]) : 0;
  }
  return out;
}

/**
 * 加权匹配度（0-100）
 *
 * 公式：
 *   对每个维度 i：
 *     gap_i  = max(0, required_i - current_i) / 100   # 仅惩罚不足
 *     score_i = 1 - gap_i
 *   match  = sum(weight_i * score_i) * 100
 */
export function calculateMatchRate(
  scores: CompetencyScores,
  requirement: PositionRequirement,
): number {
  const w = normalizeWeights(requirement.weights);
  let acc = 0;
  for (const k of DIMENSION_KEYS) {
    const current = clamp01(scores[k]);
    const required = clamp01(requirement.required[k]);
    const gap = Math.max(0, required - current);
    const dimScore = 1 - gap / 100;
    acc += w[k] * dimScore;
  }
  return Math.max(0, Math.min(100, Math.round(acc * 100)));
}

/** 计算 5 维 Gap + 严重度 */
export function analyzeCompetencyGap(
  scores: CompetencyScores,
  requirement: PositionRequirement,
): CompetencyGap[] {
  return DIMENSION_KEYS.map((dim) => {
    const current = clamp01(scores[dim]);
    const required = clamp01(requirement.required[dim]);
    const gap = required - current;

    let severity: CompetencyGap['severity'];
    if (gap <= 0) severity = 'none';
    else if (gap < 15) severity = 'minor';
    else if (gap < 35) severity = 'moderate';
    else severity = 'critical';

    return { dimension: dim, current, required, gap, severity };
  });
}

/**
 * 招聘推荐决策
 *
 * 规则：
 *   - 任一 critical gap → 至多 on_hold
 *   - match >= 85       → strong_hire
 *   - match >= 70       → hire
 *   - match >= 50       → on_hold
 *   - 其余              → no_hire
 */
export function recommendDecision(
  matchRate: number,
  gaps: CompetencyGap[],
): Assessment['recommendation'] {
  const hasCritical = gaps.some((g) => g.severity === 'critical');

  if (matchRate >= 85) return hasCritical ? 'on_hold' : 'strong_hire';
  if (matchRate >= 70) return hasCritical ? 'on_hold' : 'hire';
  if (matchRate >= 50) return 'on_hold';
  return 'no_hire';
}

/**
 * 一站式：从答题 → scores → match → gaps → decision
 */
export function runAssessment(
  answers: AssessmentAnswer[],
  requirement: PositionRequirement,
): {
  scores: CompetencyScores;
  match_rate: number;
  gaps: CompetencyGap[];
  recommendation: Assessment['recommendation'];
} {
  const scores = calculateCompetencyScores(answers);
  const match_rate = calculateMatchRate(scores, requirement);
  const gaps = analyzeCompetencyGap(scores, requirement);
  const recommendation = recommendDecision(match_rate, gaps);
  return { scores, match_rate, gaps, recommendation };
}

/** 兜底：未知岗位回退到 Senior Software Engineer 模板 */
export function getPositionRequirement(position: string): PositionRequirement {
  return (
    POSITION_REQUIREMENTS[position] ??
    POSITION_REQUIREMENTS['Senior Software Engineer']
  );
}
