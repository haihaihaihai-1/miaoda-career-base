/**
 * Teaching brand - 教学网站 LLM 客户端
 * 接 workspace assistant-teaching-website/affiliate-project/AvatarServer/AvatarServer/LLM.py
 *
 * 与 difyApi.ts 解耦：可作为 provider 注入到 AIAdvisorWidget
 */

export interface TeachingChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TeachingChatRequest {
  messages: TeachingChatMessage[];
  course_id?: string;
  student_id?: string;
  knowledge_scope?: string[]; // RAG 检索范围
}

export interface TeachingChatChunk {
  type: 'token' | 'done' | 'error' | 'meta';
  content?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

/** 默认 endpoint，可被 VITE_LLM_PROXY_URL 覆盖 */
const DEFAULT_LLM_ENDPOINT = '/api/llm/chat';

/** SSE 流式调用 LLM.py 端点 */
export async function streamTeachingChat(
  req: TeachingChatRequest,
  onChunk: (chunk: TeachingChatChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const endpoint = import.meta.env.VITE_LLM_PROXY_URL ?? DEFAULT_LLM_ENDPOINT;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    onChunk({ type: 'error', error: `network: ${err}` });
    return;
  }

  if (!response.ok) {
    onChunk({ type: 'error', error: `HTTP ${response.status}` });
    return;
  }

  if (!response.body) {
    onChunk({ type: 'error', error: 'no response body' });
    return;
  }

  const reader = response.body.getReader();
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
        const line = ev
          .split('\n')
          .find((l) => l.startsWith('data:'));
        if (!line) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') {
          onChunk({ type: 'done' });
          continue;
        }
        try {
          const parsed = JSON.parse(payload);
          onChunk({
            type: 'token',
            content: parsed.content ?? parsed.delta ?? '',
            metadata: parsed.meta,
          });
        } catch {
          // 非 JSON 行，按原文输出
          onChunk({ type: 'token', content: payload });
        }
      }
    }
    onChunk({ type: 'done' });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    onChunk({ type: 'error', error: `stream: ${err}` });
  } finally {
    reader.releaseLock();
  }
}

/** 健康检查 */
export async function pingTeachingLLM(timeoutMs = 4000): Promise<boolean> {
  const endpoint =
    (import.meta.env.VITE_LLM_PROXY_URL ?? DEFAULT_LLM_ENDPOINT).replace(/\/chat$/, '') +
    '/health';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(endpoint, { signal: ctrl.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
