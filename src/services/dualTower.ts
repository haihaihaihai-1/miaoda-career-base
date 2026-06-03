/**
 * HireFlow 双塔匹配客户端
 *
 * 架构参考：workspace dual_tower（蛋白序列+结构）证明了双塔检索范式的有效性，
 *           本模块为 hireflow 业务封装"候选人塔 ↔ 岗位塔"的抽象接口。
 *
 * - 抽象接口 DualTowerClient，可注入任意后端实现
 * - 内置 MockDualTowerClient 用于离线演示与测试
 * - 提供 HttpDualTowerClient 接已部署的双塔服务（REST）
 */

import type { Candidate, CompetencyScores } from '@/types/hireflow';
import { POSITION_REQUIREMENTS, runAssessment } from './competencyAnalysis';

/** 嵌入向量（任意维度） */
export type Embedding = number[];

/** 岗位画像 —— 双塔的"岗位塔"输出 */
export interface PositionProfile {
  id: string;
  title: string;
  level: string; // 'junior' | 'mid' | 'senior' | 'staff' | ...
  required_competencies: CompetencyScores;
  embedding?: Embedding;
  /** 业务侧元数据，例如 location/team/salary_band 等 */
  metadata?: Record<string, unknown>;
}

/** 候选人 → 岗位匹配结果 */
export interface MatchResult {
  position_id: string;
  position_title: string;
  match_score: number; // 0-100
  /** 推荐理由文本 */
  reasoning?: string;
  /** 各维度详细贡献 */
  dimension_contribution?: CompetencyScores;
}

/** 双塔抽象接口 */
export interface DualTowerClient {
  /** 把候选人嵌入为向量 */
  embedCandidate(candidate: Candidate): Promise<Embedding>;

  /** 把岗位画像嵌入为向量 */
  embedPosition(position: PositionProfile): Promise<Embedding>;

  /** 为候选人推荐 top-k 岗位 */
  matchCandidate(candidate: Candidate, topK?: number): Promise<MatchResult[]>;

  /** 为岗位推荐 top-k 候选人 */
  matchPosition(positionId: string, topK?: number): Promise<Candidate[]>;

  /** 列出已知岗位（用于 UI 下拉） */
  listPositions(): Promise<PositionProfile[]>;

  /** 健康检查 */
  ping(): Promise<boolean>;
}

// ============================================================================
// Mock 实现 —— 基于 competencyAnalysis 的内置岗位模板
// ============================================================================

/** 把 CompetencyScores 转 5 维向量 */
export function competencyToVector(s: CompetencyScores): Embedding {
  return [s.professional, s.learning, s.communication, s.resilience, s.leadership];
}

/** 余弦相似度（双塔评分常用度量） */
export function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** 把 0-1 余弦相似度映射到 0-100 匹配分（线性 + clamp） */
export function cosineToMatchScore(cos: number): number {
  return Math.max(0, Math.min(100, Math.round(cos * 100)));
}

/** Mock 客户端：完全离线，基于内置岗位模板 */
export class MockDualTowerClient implements DualTowerClient {
  private positions: PositionProfile[];

  constructor(customPositions?: PositionProfile[]) {
    this.positions =
      customPositions ??
      Object.entries(POSITION_REQUIREMENTS).map(([title, req]) => ({
        id: `mock-${title.toLowerCase().replace(/\s+/g, '-')}`,
        title,
        level: title.toLowerCase().includes('junior')
          ? 'junior'
          : title.toLowerCase().includes('manager') || title.toLowerCase().includes('lead')
          ? 'senior'
          : 'mid',
        required_competencies: req.required,
      }));
  }

  async embedCandidate(candidate: Candidate): Promise<Embedding> {
    if (!candidate.competency_scores) {
      return [0, 0, 0, 0, 0];
    }
    return competencyToVector(candidate.competency_scores);
  }

  async embedPosition(position: PositionProfile): Promise<Embedding> {
    return competencyToVector(position.required_competencies);
  }

  async matchCandidate(candidate: Candidate, topK = 5): Promise<MatchResult[]> {
    if (!candidate.competency_scores) return [];
    const candVec = await this.embedCandidate(candidate);

    const results: MatchResult[] = [];
    for (const pos of this.positions) {
      const posVec = await this.embedPosition(pos);
      const cos = cosineSimilarity(candVec, posVec);
      // 同时计算 competency-based match（更解释性强）
      const req = POSITION_REQUIREMENTS[pos.title];
      const compMatch = req
        ? runAssessment(
            // 把候选人 scores 当作"答题"传入
            Object.entries(candidate.competency_scores).map(([dim, score]) => ({
              question_id: dim,
              dimension: dim as keyof CompetencyScores,
              question: '',
              answer: '',
              score,
              source: 'self' as const,
            })),
            req,
          ).match_rate
        : cosineToMatchScore(cos);

      // 综合：60% 双塔余弦 + 40% 加权匹配
      const finalScore = Math.round(0.6 * cosineToMatchScore(cos) + 0.4 * compMatch);

      results.push({
        position_id: pos.id,
        position_title: pos.title,
        match_score: finalScore,
        reasoning: `双塔余弦 ${cos.toFixed(2)}，加权匹配 ${compMatch}%`,
        dimension_contribution: candidate.competency_scores,
      });
    }

    return results.sort((a, b) => b.match_score - a.match_score).slice(0, topK);
  }

  async matchPosition(positionId: string, _topK = 5): Promise<Candidate[]> {
    // Mock 不持有候选人池；真实实现应连 Supabase
    return [];
  }

  async listPositions(): Promise<PositionProfile[]> {
    return [...this.positions];
  }

  async ping(): Promise<boolean> {
    return true;
  }
}

// ============================================================================
// HTTP 实现 —— 接已部署的双塔服务
// ============================================================================

export class HttpDualTowerClient implements DualTowerClient {
  constructor(private baseUrl: string, private authToken?: string) {}

  private headers(): HeadersInit {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.authToken) h['Authorization'] = `Bearer ${this.authToken}`;
    return h;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`dual_tower HTTP ${r.status}`);
    return (await r.json()) as T;
  }

  private async get<T>(path: string): Promise<T> {
    const r = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    if (!r.ok) throw new Error(`dual_tower HTTP ${r.status}`);
    return (await r.json()) as T;
  }

  embedCandidate(candidate: Candidate): Promise<Embedding> {
    return this.post<Embedding>('/embed/candidate', candidate);
  }

  embedPosition(position: PositionProfile): Promise<Embedding> {
    return this.post<Embedding>('/embed/position', position);
  }

  matchCandidate(candidate: Candidate, topK = 5): Promise<MatchResult[]> {
    return this.post<MatchResult[]>(`/match/candidate?top_k=${topK}`, candidate);
  }

  matchPosition(positionId: string, topK = 5): Promise<Candidate[]> {
    return this.get<Candidate[]>(
      `/match/position/${encodeURIComponent(positionId)}?top_k=${topK}`,
    );
  }

  listPositions(): Promise<PositionProfile[]> {
    return this.get<PositionProfile[]>('/positions');
  }

  async ping(): Promise<boolean> {
    try {
      const r = await fetch(`${this.baseUrl}/health`, { headers: this.headers() });
      return r.ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// 工厂：按环境变量切换 Mock / HTTP
// ============================================================================

let _client: DualTowerClient | null = null;

export function getDualTowerClient(): DualTowerClient {
  if (_client) return _client;
  const url = import.meta.env.VITE_DUAL_TOWER_URL;
  const token = import.meta.env.VITE_DUAL_TOWER_TOKEN;
  if (url) {
    _client = new HttpDualTowerClient(url, token);
  } else {
    _client = new MockDualTowerClient();
  }
  return _client;
}

/** 测试用：注入自定义 client（如 mock） */
export function __setDualTowerClient(client: DualTowerClient | null): void {
  _client = client;
}
