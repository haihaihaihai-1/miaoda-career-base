/**
 * 单元测试 - dualTower SDK
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockDualTowerClient,
  cosineSimilarity,
  cosineToMatchScore,
  competencyToVector,
  __setDualTowerClient,
  getDualTowerClient,
} from '@/services/dualTower';
import type { Candidate, CompetencyScores } from '@/types/hireflow';

const baseCandidate: Candidate = {
  id: 'c-1',
  name: 'Test',
  target_position: 'Senior Software Engineer',
  experience_years: 5,
  interview_stage: 'initial',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const scores: CompetencyScores = {
  professional: 80,
  learning: 70,
  communication: 70,
  resilience: 70,
  leadership: 60,
};

describe('cosineSimilarity', () => {
  it('完全相同向量 → 1', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });
  it('正交向量 → 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });
  it('空向量 → 0', () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });
  it('长度不匹配 → 0', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });
  it('反向向量 → -1', () => {
    expect(cosineSimilarity([1, 2], [-1, -2])).toBeCloseTo(-1, 5);
  });
});

describe('cosineToMatchScore', () => {
  it('1 → 100', () => {
    expect(cosineToMatchScore(1)).toBe(100);
  });
  it('0 → 0', () => {
    expect(cosineToMatchScore(0)).toBe(0);
  });
  it('-0.5 clamp 0', () => {
    expect(cosineToMatchScore(-0.5)).toBe(0);
  });
  it('0.85 → 85', () => {
    expect(cosineToMatchScore(0.85)).toBe(85);
  });
});

describe('competencyToVector', () => {
  it('转 5 维数组', () => {
    const v = competencyToVector(scores);
    expect(v).toHaveLength(5);
    expect(v).toEqual([80, 70, 70, 70, 60]);
  });
});

describe('MockDualTowerClient', () => {
  let client: MockDualTowerClient;
  beforeEach(() => {
    client = new MockDualTowerClient();
  });

  it('ping 返回 true', async () => {
    expect(await client.ping()).toBe(true);
  });

  it('listPositions 至少返回 3 个岗位', async () => {
    const positions = await client.listPositions();
    expect(positions.length).toBeGreaterThanOrEqual(3);
    for (const p of positions) {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.required_competencies).toBeTruthy();
    }
  });

  it('embedCandidate 返回 5 维向量', async () => {
    const v = await client.embedCandidate({ ...baseCandidate, competency_scores: scores });
    expect(v).toHaveLength(5);
  });

  it('embedCandidate 无 scores 返回零向量', async () => {
    const v = await client.embedCandidate(baseCandidate);
    expect(v).toEqual([0, 0, 0, 0, 0]);
  });

  it('matchCandidate top-k 排序正确', async () => {
    const candidate: Candidate = { ...baseCandidate, competency_scores: scores };
    const results = await client.matchCandidate(candidate, 3);
    expect(results.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].match_score).toBeGreaterThanOrEqual(results[i].match_score);
    }
    for (const r of results) {
      expect(r.match_score).toBeGreaterThanOrEqual(0);
      expect(r.match_score).toBeLessThanOrEqual(100);
    }
  });

  it('matchCandidate 无 scores 返回空列表', async () => {
    const results = await client.matchCandidate(baseCandidate);
    expect(results).toEqual([]);
  });

  it('candidate scores 完美对齐 Senior 岗位 → 该岗位排前列', async () => {
    // Senior 要求 prof=85, learning=75 …，我们造一个超高分候选人
    const high: CompetencyScores = {
      professional: 95,
      learning: 90,
      communication: 90,
      resilience: 90,
      leadership: 85,
    };
    const candidate: Candidate = { ...baseCandidate, competency_scores: high };
    const results = await client.matchCandidate(candidate, 5);
    expect(results[0].match_score).toBeGreaterThanOrEqual(80);
  });
});

describe('getDualTowerClient', () => {
  it('单例：连续调用返回同一对象', () => {
    __setDualTowerClient(null);
    const a = getDualTowerClient();
    const b = getDualTowerClient();
    expect(a).toBe(b);
  });
  it('注入测试 client 后被使用', () => {
    const fake = new MockDualTowerClient();
    __setDualTowerClient(fake);
    expect(getDualTowerClient()).toBe(fake);
    __setDualTowerClient(null);
  });
});
