/**
 * 单元测试 - aiScoring 启发式分数
 * Dify 部分需要网络，留作集成测试；这里只测 heuristicScore + 兜底逻辑
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { heuristicScore, scoreCaseAnswer, scoreAllCaseAnswers } from '@/services/aiScoring';

describe('heuristicScore', () => {
  it('空字符串 → 30', () => {
    expect(heuristicScore('')).toBe(30);
    expect(heuristicScore('   ')).toBe(30);
  });
  it('短答案 (<30) → 45', () => {
    expect(heuristicScore('简短回答')).toBe(45);
  });
  it('中等答案 (30-79) → 60', () => {
    expect(heuristicScore('a'.repeat(50))).toBe(60);
  });
  it('较长答案 (80-149) → 72', () => {
    expect(heuristicScore('a'.repeat(120))).toBe(72);
  });
  it('详细答案 (150-249) → 80', () => {
    expect(heuristicScore('a'.repeat(200))).toBe(80);
  });
  it('深度答案 (>250) → 86', () => {
    expect(heuristicScore('a'.repeat(300))).toBe(86);
  });
});

describe('scoreCaseAnswer (无 Dify 配置时)', () => {
  const origEnv = { ...import.meta.env };
  beforeEach(() => {
    // 模拟未配置 Dify
    Object.assign(import.meta.env, {
      VITE_DIFY_API_URL: '',
      VITE_DIFY_API_KEY: '',
    });
  });
  afterEach(() => {
    Object.assign(import.meta.env, origEnv);
  });

  it('未配置 Dify → 回退启发式', async () => {
    const r = await scoreCaseAnswer({
      dimension: 'professional',
      question: '请讲一个挑战',
      answer: 'a'.repeat(120),
    });
    expect(r.source).toBe('heuristic');
    expect(r.score).toBe(72);
  });

  it('scoreAllCaseAnswers 批量并行', async () => {
    const results = await scoreAllCaseAnswers([
      { dimension: 'professional', question: 'q1', answer: 'short' },
      { dimension: 'learning', question: 'q2', answer: 'a'.repeat(200) },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].source).toBe('heuristic');
    expect(results[1].source).toBe('heuristic');
    expect(results[1].score).toBe(80);
  });
});

describe('scoreCaseAnswer (Dify 网络失败时回退)', () => {
  beforeEach(() => {
    Object.assign(import.meta.env, {
      VITE_DIFY_API_URL: 'https://nonexistent.invalid.local/v1',
      VITE_DIFY_API_KEY: 'fake-key',
    });
    // mock fetch 失败
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network'))),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    Object.assign(import.meta.env, { VITE_DIFY_API_URL: '', VITE_DIFY_API_KEY: '' });
  });

  it('Dify fetch 失败 → 回退启发式', async () => {
    const r = await scoreCaseAnswer({
      dimension: 'communication',
      question: 'q',
      answer: 'a'.repeat(60),
    });
    expect(r.source).toBe('heuristic');
    expect(r.score).toBe(60);
  });
});
