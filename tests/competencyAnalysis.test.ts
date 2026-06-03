/**
 * 单元测试 - competencyAnalysis 算法
 * TDD：先写期望，再驱动 src/services/competencyAnalysis.ts 实现
 */
import { describe, it, expect } from 'vitest';
import {
  COMPETENCY_DIMENSIONS,
  POSITION_REQUIREMENTS,
  calculateCompetencyScores,
  calculateMatchRate,
  analyzeCompetencyGap,
  recommendDecision,
  normalizeWeights,
} from '@/services/competencyAnalysis';
import type {
  AssessmentAnswer,
  CompetencyScores,
  PositionRequirement,
} from '@/types/hireflow';

describe('COMPETENCY_DIMENSIONS', () => {
  it('应该有 5 个维度', () => {
    expect(COMPETENCY_DIMENSIONS).toHaveLength(5);
  });
  it('每个维度有 key/name/description/weight', () => {
    for (const d of COMPETENCY_DIMENSIONS) {
      expect(d.key).toBeTruthy();
      expect(d.name).toBeTruthy();
      expect(d.weight).toBeGreaterThan(0);
    }
  });
});

describe('normalizeWeights', () => {
  it('权重归一化后总和为 1', () => {
    const w: CompetencyScores = {
      professional: 0.5,
      learning: 0.5,
      communication: 0.5,
      resilience: 0.5,
      leadership: 0.5,
    };
    const n = normalizeWeights(w);
    const sum = Object.values(n).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
  it('全 0 权重时返回均匀分布', () => {
    const w: CompetencyScores = {
      professional: 0,
      learning: 0,
      communication: 0,
      resilience: 0,
      leadership: 0,
    };
    const n = normalizeWeights(w);
    for (const v of Object.values(n)) expect(v).toBeCloseTo(0.2, 5);
  });
});

describe('calculateCompetencyScores', () => {
  it('应该按维度均值聚合答题分数', () => {
    const answers: AssessmentAnswer[] = [
      { question_id: 'q1', dimension: 'professional', question: '', answer: '', score: 80, source: 'self' },
      { question_id: 'q2', dimension: 'professional', question: '', answer: '', score: 90, source: 'ai' },
      { question_id: 'q3', dimension: 'learning', question: '', answer: '', score: 70, source: 'self' },
      { question_id: 'q4', dimension: 'communication', question: '', answer: '', score: 60, source: 'self' },
      { question_id: 'q5', dimension: 'resilience', question: '', answer: '', score: 75, source: 'self' },
      { question_id: 'q6', dimension: 'leadership', question: '', answer: '', score: 50, source: 'self' },
    ];
    const scores = calculateCompetencyScores(answers);
    expect(scores.professional).toBe(85); // (80+90)/2
    expect(scores.learning).toBe(70);
    expect(scores.communication).toBe(60);
    expect(scores.resilience).toBe(75);
    expect(scores.leadership).toBe(50);
  });

  it('缺失维度时该维度分数为 0', () => {
    const answers: AssessmentAnswer[] = [
      { question_id: 'q1', dimension: 'professional', question: '', answer: '', score: 80, source: 'self' },
    ];
    const scores = calculateCompetencyScores(answers);
    expect(scores.professional).toBe(80);
    expect(scores.learning).toBe(0);
    expect(scores.leadership).toBe(0);
  });

  it('给 ai/interviewer 来源更高权重（>self）', () => {
    const a1: AssessmentAnswer[] = [
      { question_id: 'q1', dimension: 'professional', question: '', answer: '', score: 60, source: 'self' },
    ];
    const a2: AssessmentAnswer[] = [
      { question_id: 'q1', dimension: 'professional', question: '', answer: '', score: 60, source: 'interviewer' },
    ];
    // self 分数 = 60，但 interviewer 等权重应≥ 60
    expect(calculateCompetencyScores(a2).professional).toBeGreaterThanOrEqual(
      calculateCompetencyScores(a1).professional,
    );
  });

  it('分数范围 0-100', () => {
    const answers: AssessmentAnswer[] = [
      { question_id: 'q1', dimension: 'professional', question: '', answer: '', score: 150, source: 'self' },
      { question_id: 'q2', dimension: 'learning', question: '', answer: '', score: -10, source: 'self' },
    ];
    const scores = calculateCompetencyScores(answers);
    expect(scores.professional).toBeLessThanOrEqual(100);
    expect(scores.learning).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateMatchRate', () => {
  const fullScore: CompetencyScores = {
    professional: 100,
    learning: 100,
    communication: 100,
    resilience: 100,
    leadership: 100,
  };
  const req: PositionRequirement = {
    position: 'Senior Engineer',
    required: {
      professional: 80,
      learning: 70,
      communication: 60,
      resilience: 65,
      leadership: 50,
    },
    weights: {
      professional: 0.4,
      learning: 0.2,
      communication: 0.15,
      resilience: 0.1,
      leadership: 0.15,
    },
  };

  it('满分候选人 match >= 95', () => {
    expect(calculateMatchRate(fullScore, req)).toBeGreaterThanOrEqual(95);
  });

  it('零分候选人 match 应明显低于录用线（< 50）', () => {
    const zero: CompetencyScores = {
      professional: 0,
      learning: 0,
      communication: 0,
      resilience: 0,
      leadership: 0,
    };
    // 加权 gap 模型下，零分候选人 match ≈ Σ(weight * (1 - required/100))，
    // 通常 < 50，必然 < 70（hire 阈值）。
    const m = calculateMatchRate(zero, req);
    expect(m).toBeGreaterThanOrEqual(0);
    expect(m).toBeLessThan(50);
  });

  it('恰好达到要求的候选人 match >= 70', () => {
    expect(calculateMatchRate(req.required, req)).toBeGreaterThanOrEqual(70);
  });

  it('match 范围 0-100', () => {
    const m = calculateMatchRate(fullScore, req);
    expect(m).toBeGreaterThanOrEqual(0);
    expect(m).toBeLessThanOrEqual(100);
  });
});

describe('analyzeCompetencyGap', () => {
  it('current < required 时 gap > 0', () => {
    const scores: CompetencyScores = {
      professional: 50, learning: 80, communication: 60, resilience: 70, leadership: 40,
    };
    const req: PositionRequirement = {
      position: 'X',
      required: {
        professional: 80, learning: 70, communication: 60, resilience: 65, leadership: 50,
      },
      weights: {
        professional: 0.4, learning: 0.2, communication: 0.15, resilience: 0.1, leadership: 0.15,
      },
    };
    const gaps = analyzeCompetencyGap(scores, req);
    expect(gaps).toHaveLength(5);
    const prof = gaps.find((g) => g.dimension === 'professional')!;
    expect(prof.gap).toBeGreaterThan(0);
    expect(prof.severity).not.toBe('none');

    const learn = gaps.find((g) => g.dimension === 'learning')!;
    expect(learn.gap).toBeLessThanOrEqual(0);
    expect(learn.severity).toBe('none');
  });

  it('severity 阈值正确', () => {
    const scores: CompetencyScores = {
      professional: 50, learning: 50, communication: 50, resilience: 50, leadership: 50,
    };
    const req: PositionRequirement = {
      position: 'X',
      required: {
        professional: 95, // gap=45 critical
        learning: 75,     // gap=25 moderate
        communication: 60, // gap=10 minor
        resilience: 50,    // gap=0 none
        leadership: 40,    // gap=-10 none
      },
      weights: {
        professional: 0.2, learning: 0.2, communication: 0.2, resilience: 0.2, leadership: 0.2,
      },
    };
    const gaps = analyzeCompetencyGap(scores, req);
    expect(gaps.find((g) => g.dimension === 'professional')!.severity).toBe('critical');
    expect(gaps.find((g) => g.dimension === 'learning')!.severity).toBe('moderate');
    expect(gaps.find((g) => g.dimension === 'communication')!.severity).toBe('minor');
    expect(gaps.find((g) => g.dimension === 'resilience')!.severity).toBe('none');
    expect(gaps.find((g) => g.dimension === 'leadership')!.severity).toBe('none');
  });
});

describe('recommendDecision', () => {
  it('match >= 85 → strong_hire', () => {
    expect(recommendDecision(90, [])).toBe('strong_hire');
  });
  it('match 70-84 → hire', () => {
    expect(recommendDecision(75, [])).toBe('hire');
  });
  it('match 50-69 → on_hold', () => {
    expect(recommendDecision(60, [])).toBe('on_hold');
  });
  it('match < 50 → no_hire', () => {
    expect(recommendDecision(30, [])).toBe('no_hire');
  });
  it('存在 critical gap 时降级（match 80 → on_hold）', () => {
    const gaps = [
      { dimension: 'professional' as const, current: 30, required: 80, gap: 50, severity: 'critical' as const },
    ];
    expect(recommendDecision(80, gaps)).toBe('on_hold');
  });
});

describe('POSITION_REQUIREMENTS', () => {
  it('内置至少 3 个岗位模板', () => {
    expect(Object.keys(POSITION_REQUIREMENTS).length).toBeGreaterThanOrEqual(3);
  });
  it('每个岗位 required 字段 5 维齐全', () => {
    for (const req of Object.values(POSITION_REQUIREMENTS)) {
      expect(Object.keys(req.required)).toHaveLength(5);
      expect(Object.keys(req.weights)).toHaveLength(5);
    }
  });
});
