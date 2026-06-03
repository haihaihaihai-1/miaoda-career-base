/**
 * AI 案例题评分服务
 *
 * 优先用 Dify 应用进行评分；不可用时回退到长度启发式（占位）。
 * 输入：候选人在某个胜任力维度的开放题作答
 * 输出：0-100 的评分 + 理由（可选）
 */
import type { CompetencyDimension } from '@/types/hireflow';

export interface AIScoringRequest {
  dimension: CompetencyDimension;
  question: string;
  answer: string;
  /** 候选人目标岗位（用于评分上下文） */
  target_position?: string;
}

export interface AIScoringResult {
  score: number; // 0-100
  reasoning?: string;
  /** 评分来源 */
  source: 'dify' | 'heuristic';
}

/** 启发式占位评分（兜底，从 Wizard 提取） */
export function heuristicScore(answer: string): number {
  const t = answer.trim();
  if (t.length === 0) return 30;
  if (t.length < 30) return 45;
  if (t.length < 80) return 60;
  if (t.length < 150) return 72;
  if (t.length < 250) return 80;
  return 86;
}

interface DifyChatResponse {
  answer?: string;
  event?: string;
  metadata?: Record<string, unknown>;
}

/** 调用 Dify Workflow / Chatflow，期望返回 JSON-with-score */
async function scoreWithDify(req: AIScoringRequest): Promise<AIScoringResult | null> {
  const apiUrl = import.meta.env.VITE_DIFY_API_URL;
  const apiKey = import.meta.env.VITE_DIFY_API_KEY;
  if (!apiUrl || !apiKey) return null;

  const prompt =
    `请作为面试评估专家，为候选人下面这段开放题作答打分（0-100 整数）。\n` +
    `胜任力维度: ${req.dimension}\n` +
    `目标岗位: ${req.target_position ?? '未指定'}\n` +
    `题目: ${req.question}\n` +
    `候选人作答: ${req.answer}\n\n` +
    `请只输出 JSON: {"score": <0-100>, "reasoning": "<一句话理由>"}`;

  try {
    const res = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: {},
        query: prompt,
        response_mode: 'blocking',
        user: 'hireflow-scoring',
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as DifyChatResponse;
    const raw = data.answer ?? '';
    const match = raw.match(/\{[\s\S]*?\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { score?: number; reasoning?: string };
    if (typeof parsed.score !== 'number') return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      reasoning: parsed.reasoning,
      source: 'dify',
    };
  } catch {
    return null;
  }
}

/** 主入口：先试 Dify，失败回退启发式 */
export async function scoreCaseAnswer(req: AIScoringRequest): Promise<AIScoringResult> {
  const fromDify = await scoreWithDify(req);
  if (fromDify) return fromDify;
  return {
    score: heuristicScore(req.answer),
    source: 'heuristic',
    reasoning: '（未配置 Dify，使用长度启发式占位评分）',
  };
}

/** 批量评分多个维度的案例题（并行） */
export async function scoreAllCaseAnswers(
  reqs: AIScoringRequest[],
): Promise<AIScoringResult[]> {
  return Promise.all(reqs.map((r) => scoreCaseAnswer(r)));
}
