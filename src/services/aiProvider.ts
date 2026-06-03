/**
 * ChatProvider 抽象 —— 把不同后端（Dify / Teaching LLM / Campus RAG）统一为流式接口
 *
 * 设计：
 *   - ChatProvider 是纯接口，不耦合 UI
 *   - 工厂 getProviderForBrand(brandId) 按 brand 选择默认 provider
 *   - 运行时可通过 setActiveProvider 切换（ChatProviderCard）
 *   - 用户偏好通过 localStorage 持久化
 */
import { streamTeachingChat, pingTeachingLLM, type TeachingChatMessage } from './teachingLLM';
import { streamCampusQA } from './campusRAG';
import { pingCampusAPI } from './campusAPI';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatChunk {
  type: 'token' | 'source' | 'done' | 'error';
  content?: string;
  source?: { id: string; title: string; url?: string };
  error?: string;
}

export interface ChatProvider {
  /** 唯一标识 */
  id: string;
  /** 显示名 */
  name: string;
  /** 简介 */
  description: string;
  /** 流式发送 */
  streamChat(
    messages: ChatMessage[],
    onChunk: (chunk: ChatChunk) => void,
    signal?: AbortSignal,
  ): Promise<void>;
  /** 健康检查 */
  ping(): Promise<boolean>;
  /** 是否需要预先配置才能用（如 API Key 缺失） */
  isConfigured(): boolean;
}

// ============================================================================
// Mock Provider —— 兜底，离线可用
// ============================================================================

class MockProvider implements ChatProvider {
  id = 'mock';
  name = 'Mock 演示助手';
  description = '离线占位 provider，回声式回复（不联网）';

  async streamChat(
    messages: ChatMessage[],
    onChunk: (c: ChatChunk) => void,
  ): Promise<void> {
    const last = messages[messages.length - 1]?.content ?? '';
    const reply = `（演示模式）你说："${last}"。请配置真实 provider 以获得 AI 回复。`;
    // 模拟流式：逐字推送
    for (const ch of reply) {
      onChunk({ type: 'token', content: ch });
      await new Promise((r) => setTimeout(r, 8));
    }
    onChunk({ type: 'done' });
  }

  async ping(): Promise<boolean> {
    return true;
  }

  isConfigured(): boolean {
    return true;
  }
}

// ============================================================================
// Dify Provider —— 默认 brand 与 hireflow 用
// ============================================================================

class DifyProvider implements ChatProvider {
  id = 'dify';
  name = 'Dify 对话';
  description = '基于 Dify 平台的对话应用，支持自定义 Workflow / Chatflow';

  isConfigured(): boolean {
    // 同时检查 env 和 localStorage 配置
    if (import.meta.env.VITE_DIFY_API_URL && import.meta.env.VITE_DIFY_API_KEY) {
      return true;
    }
    try {
      const raw = localStorage.getItem('dify_config');
      if (!raw) return false;
      const cfg = JSON.parse(raw) as { apiUrl?: string; apiKey?: string };
      return !!cfg.apiUrl && !!cfg.apiKey;
    } catch {
      return false;
    }
  }

  private resolveConfig(): { apiUrl: string; apiKey: string } | null {
    // localStorage 优先（运行时配置）
    try {
      const raw = localStorage.getItem('dify_config');
      if (raw) {
        const cfg = JSON.parse(raw) as { apiUrl?: string; apiKey?: string };
        if (cfg.apiUrl && cfg.apiKey) {
          return {
            apiUrl: cfg.apiUrl.replace(/\/$/, ''),
            apiKey: cfg.apiKey,
          };
        }
      }
    } catch {
      /* ignore */
    }
    const envUrl = import.meta.env.VITE_DIFY_API_URL;
    const envKey = import.meta.env.VITE_DIFY_API_KEY;
    if (envUrl && envKey) {
      return { apiUrl: envUrl.replace(/\/$/, ''), apiKey: envKey };
    }
    return null;
  }

  async streamChat(
    messages: ChatMessage[],
    onChunk: (c: ChatChunk) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const cfg = this.resolveConfig();
    if (!cfg) {
      onChunk({
        type: 'error',
        error: 'Dify 未配置（缺少 API URL / Key）',
      });
      return;
    }

    const last = messages[messages.length - 1]?.content ?? '';
    let res: Response;
    try {
      res = await fetch(`${cfg.apiUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          inputs: {},
          query: last,
          response_mode: 'streaming',
          user: 'miaoda-base',
          conversation_id: '',
        }),
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
            const parsed = JSON.parse(payload) as {
              event?: string;
              answer?: string;
            };
            if (parsed.event === 'message' && parsed.answer) {
              onChunk({ type: 'token', content: parsed.answer });
            }
          } catch {
            /* ignore */
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

  async ping(): Promise<boolean> {
    const cfg = this.resolveConfig();
    if (!cfg) return false;
    try {
      const r = await fetch(`${cfg.apiUrl}/parameters`, {
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
      });
      return r.ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Teaching Provider —— 接 workspace LLM.py
// ============================================================================

class TeachingProvider implements ChatProvider {
  id = 'teaching';
  name = '教学 AI 助教';
  description = '接入教学网站 LLM 端点（SSE 流式）';

  isConfigured(): boolean {
    return true; // teachingLLM 有默认 /api/llm/chat fallback
  }

  async streamChat(
    messages: ChatMessage[],
    onChunk: (c: ChatChunk) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const teachingMsgs: TeachingChatMessage[] = messages.map((m) => ({
      role: m.role === 'system' ? 'system' : m.role,
      content: m.content,
    }));
    await streamTeachingChat(
      { messages: teachingMsgs },
      (chunk) => {
        if (chunk.type === 'token') {
          onChunk({ type: 'token', content: chunk.content ?? '' });
        } else if (chunk.type === 'error') {
          onChunk({ type: 'error', error: chunk.error });
        } else if (chunk.type === 'done') {
          onChunk({ type: 'done' });
        }
      },
      signal,
    );
  }

  async ping(): Promise<boolean> {
    return pingTeachingLLM();
  }
}

// ============================================================================
// Campus Provider —— 接校园 RAG 知识库
// ============================================================================

class CampusProvider implements ChatProvider {
  id = 'campus';
  name = '校园问答';
  description = '基于校园知识库（xmxc）的 RAG 流式问答';

  isConfigured(): boolean {
    return true;
  }

  async streamChat(
    messages: ChatMessage[],
    onChunk: (c: ChatChunk) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      onChunk({ type: 'error', error: '没有 user 消息' });
      return;
    }
    const history = messages
      .filter((m) => m !== lastUser && m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    await streamCampusQA(
      { question: lastUser.content, history },
      (chunk) => {
        if (chunk.type === 'token') {
          onChunk({ type: 'token', content: chunk.content ?? '' });
        } else if (chunk.type === 'source' && chunk.source) {
          onChunk({ type: 'source', source: chunk.source });
        } else if (chunk.type === 'error') {
          onChunk({ type: 'error', error: chunk.error });
        } else if (chunk.type === 'done') {
          onChunk({ type: 'done' });
        }
      },
      signal,
    );
  }

  async ping(): Promise<boolean> {
    return pingCampusAPI();
  }
}

// ============================================================================
// Registry + Factory
// ============================================================================

const PROVIDERS: Record<string, ChatProvider> = {
  mock: new MockProvider(),
  dify: new DifyProvider(),
  teaching: new TeachingProvider(),
  campus: new CampusProvider(),
};

const ACTIVE_KEY = 'miaoda-active-provider';

/** 按 brand 选择默认 provider id（可被 localStorage 覆盖） */
function defaultProviderIdForBrand(brandId: string): string {
  switch (brandId) {
    case 'teaching':
      return 'teaching';
    case 'campus':
      return 'campus';
    case 'hireflow':
    case 'default':
    case 'lai-lu':
    default:
      return 'dify';
  }
}

/** 列出所有 provider */
export function listProviders(): ChatProvider[] {
  return Object.values(PROVIDERS);
}

export function getProviderById(id: string): ChatProvider {
  return PROVIDERS[id] ?? PROVIDERS.mock;
}

/** 获取当前激活的 provider（按 brand + localStorage 偏好） */
export function getActiveProvider(brandId: string): ChatProvider {
  let preferred: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      preferred = localStorage.getItem(`${ACTIVE_KEY}:${brandId}`);
    } catch {
      /* noop */
    }
  }
  const id = preferred ?? defaultProviderIdForBrand(brandId);
  return getProviderById(id);
}

export function setActiveProvider(brandId: string, providerId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${ACTIVE_KEY}:${brandId}`, providerId);
    activeListeners.forEach((l) => l(brandId, providerId));
  } catch {
    /* noop */
  }
}

type ActiveListener = (brandId: string, providerId: string) => void;
const activeListeners = new Set<ActiveListener>();
export function onActiveProviderChange(listener: ActiveListener): () => void {
  activeListeners.add(listener);
  return () => activeListeners.delete(listener);
}

/** 测试用：注入自定义 provider（如 stub）
 * 注意：函数名故意不带 `__` 前缀，避免与 TypeScript __name 助手冲突
 */
export function registerProviderForTest(provider: ChatProvider): void {
  PROVIDERS[provider.id] = provider;
}

export function setProviderForTest(brandId: string, providerId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${ACTIVE_KEY}:${brandId}`, providerId);
  } catch {
    /* noop */
  }
}
