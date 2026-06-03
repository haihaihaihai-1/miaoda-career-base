/**
 * Campus brand - RAG 校园问答（流式）
 * 接 workspace xmxc-knowledge-base 索引
 *
 * 复用 teachingLLM 的 SSE 解析逻辑思路，但 endpoint 不同
 */

export interface CampusQARequest {
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  campus?: string;
  /** 限定检索范围（如"教务/选课/财务"） */
  scope?: string[];
}

export interface CampusQAChunk {
  type: 'token' | 'source' | 'done' | 'error';
  content?: string;
  /** 引用的知识库源 */
  source?: { id: string; title: string; url?: string; snippet?: string };
  error?: string;
}

const DEFAULT_ENDPOINT = '/api/qa';

export async function streamCampusQA(
  req: CampusQARequest,
  onChunk: (chunk: CampusQAChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const base = import.meta.env.VITE_CAMPUS_API_BASE ?? '';
  const endpoint = base ? `${base.replace(/\/$/, '')}/qa` : DEFAULT_ENDPOINT;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    onChunk({ type: 'error', error: e instanceof Error ? e.message : String(e) });
    return;
  }

  if (!res.ok || !res.body) {
    onChunk({ type: 'error', error: `HTTP ${res.status}` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const ev of events) {
        const line = ev.split('\n').find((l) => l.startsWith('data:'));
        if (!line) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') {
          onChunk({ type: 'done' });
          continue;
        }
        try {
          const parsed = JSON.parse(payload);
          if (parsed.source) {
            onChunk({ type: 'source', source: parsed.source });
          } else {
            onChunk({ type: 'token', content: parsed.content ?? parsed.delta ?? '' });
          }
        } catch {
          onChunk({ type: 'token', content: payload });
        }
      }
    }
    onChunk({ type: 'done' });
  } catch (e) {
    onChunk({ type: 'error', error: e instanceof Error ? e.message : String(e) });
  } finally {
    reader.releaseLock();
  }
}
