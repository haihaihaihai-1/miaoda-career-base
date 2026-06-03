/**
 * HttpDualTowerClient 集成测试（通过 MSW 拦截 fetch）
 */
import { describe, it, expect } from 'vitest';
import { server, http, HttpResponse } from './msw';
import { HttpDualTowerClient } from '@/services/dualTower';
import type { Candidate, CompetencyScores } from '@/types/hireflow';

const BASE_URL = 'https://dual-tower.test/v1';

const candidate: Candidate = {
  id: 'c-1',
  name: 'Test',
  target_position: 'Senior Software Engineer',
  experience_years: 5,
  interview_stage: 'initial',
  competency_scores: {
    professional: 80,
    learning: 75,
    communication: 70,
    resilience: 70,
    leadership: 60,
  } satisfies CompetencyScores,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('HttpDualTowerClient (via MSW)', () => {
  it('embedCandidate 转发 POST + 解析向量', async () => {
    server.use(
      http.post(`${BASE_URL}/embed/candidate`, async ({ request }) => {
        const body = (await request.json()) as Candidate;
        expect(body.id).toBe('c-1');
        return HttpResponse.json([1, 2, 3, 4, 5]);
      }),
    );
    const client = new HttpDualTowerClient(BASE_URL);
    const v = await client.embedCandidate(candidate);
    expect(v).toEqual([1, 2, 3, 4, 5]);
  });

  it('matchCandidate 转发 top_k 参数', async () => {
    server.use(
      http.post(`${BASE_URL}/match/candidate`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('top_k')).toBe('5');
        return HttpResponse.json([
          {
            position_id: 'p1',
            position_title: 'P1',
            match_score: 90,
          },
        ]);
      }),
    );
    const client = new HttpDualTowerClient(BASE_URL);
    const r = await client.matchCandidate(candidate, 5);
    expect(r).toHaveLength(1);
    expect(r[0].position_id).toBe('p1');
  });

  it('listPositions GET', async () => {
    server.use(
      http.get(`${BASE_URL}/positions`, () =>
        HttpResponse.json([
          {
            id: 'p1',
            title: 'P1',
            level: 'mid',
            required_competencies: candidate.competency_scores,
          },
        ]),
      ),
    );
    const client = new HttpDualTowerClient(BASE_URL);
    const positions = await client.listPositions();
    expect(positions).toHaveLength(1);
    expect(positions[0].id).toBe('p1');
  });

  it('ping /health 成功', async () => {
    server.use(
      http.get(`${BASE_URL}/health`, () => HttpResponse.json({ ok: true })),
    );
    const client = new HttpDualTowerClient(BASE_URL);
    expect(await client.ping()).toBe(true);
  });

  it('ping /health 失败 → false', async () => {
    server.use(
      http.get(`${BASE_URL}/health`, () =>
        HttpResponse.json({}, { status: 503 }),
      ),
    );
    const client = new HttpDualTowerClient(BASE_URL);
    expect(await client.ping()).toBe(false);
  });

  it('authToken 注入 Authorization 头', async () => {
    server.use(
      http.post(`${BASE_URL}/embed/candidate`, ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer token-xyz');
        return HttpResponse.json([0, 0, 0, 0, 0]);
      }),
    );
    const client = new HttpDualTowerClient(BASE_URL, 'token-xyz');
    await client.embedCandidate(candidate);
  });

  it('500 错误抛异常', async () => {
    server.use(
      http.post(`${BASE_URL}/embed/candidate`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const client = new HttpDualTowerClient(BASE_URL);
    await expect(client.embedCandidate(candidate)).rejects.toThrow(/HTTP 500/);
  });
});
