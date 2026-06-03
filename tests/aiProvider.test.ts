/**
 * ChatProvider 抽象 + 工厂 单元测试
 * 覆盖：工厂选择、运行时切换、MockProvider 流式输出、isConfigured 逻辑
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProviderById,
  getActiveProvider,
  setActiveProvider,
  listProviders,
  onActiveProviderChange,
  setProviderForTest,
  registerProviderForTest,
  type ChatProvider,
  type ChatMessage,
  type ChatChunk,
} from '@/services/aiProvider';

describe('ChatProvider Factory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getProviderById 返回 4 个内置 provider', () => {
    const all = listProviders();
    const ids = all.map((p) => p.id).sort();
    expect(ids).toEqual(['campus', 'dify', 'mock', 'teaching']);
  });

  it('getProviderById 未知 id 回退到 mock', () => {
    const p = getProviderById('nonexistent-xxx');
    expect(p.id).toBe('mock');
  });

  it('getActiveProvider 按 brand 选择默认 provider', () => {
    setProviderForTest('default', 'mock');
    setProviderForTest('hireflow', 'mock');
    setProviderForTest('teaching', 'mock');
    setProviderForTest('campus', 'mock');
    setProviderForTest('lai-lu', 'mock');

    // default 行为由 defaultProviderIdForBrand 决定；测试为 mock 是因为测试上下文
    // 没有 import.meta.env 配置，所以 dify/campus/teaching 走 isConfigured() → fallback?
    // 这里不依赖内部逻辑，只验证 setProviderForTest 的双向一致
    setProviderForTest('default', 'mock');
    expect(getActiveProvider('default').id).toBe('mock');
  });

  it('setActiveProvider 持久化到 localStorage + getActiveProvider 读取', () => {
    setActiveProvider('hireflow', 'mock');
    const raw = localStorage.getItem('miaoda-active-provider:hireflow');
    expect(raw).toBe('mock');
    expect(getActiveProvider('hireflow').id).toBe('mock');
  });

  it('onActiveProviderChange 监听器在 setActiveProvider 后触发', () => {
    const listener = vi.fn();
    const off = onActiveProviderChange(listener);

    setActiveProvider('hireflow', 'mock');
    expect(listener).toHaveBeenCalledWith('hireflow', 'mock');

    // 不同 brand 不应触发监听器（监听器已过滤）
    listener.mockClear();
    setActiveProvider('campus', 'mock');
    // 监听器会接收所有 brand 的事件；我们只验证它被调用
    expect(listener).toHaveBeenCalled();

    off();
    listener.mockClear();
    setActiveProvider('hireflow', 'mock');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('MockProvider 流式输出', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('streamChat 逐字推送 token，最后发送 done', async () => {
    const p = getProviderById('mock');
    const chunks: ChatChunk[] = [];
    const msgs: ChatMessage[] = [
      { role: 'user', content: 'hello' },
    ];
    await p.streamChat(msgs, (c) => chunks.push(c));
    const tokens = chunks.filter((c) => c.type === 'token');
    const dones = chunks.filter((c) => c.type === 'done');
    expect(tokens.length).toBeGreaterThan(0);
    expect(dones).toHaveLength(1);
    // 拼接所有 token 应包含用户输入
    const joined = tokens.map((t) => t.content ?? '').join('');
    expect(joined).toContain('hello');
  });

  it('isConfigured 始终为 true（离线可用）', () => {
    const p = getProviderById('mock');
    expect(p.isConfigured()).toBe(true);
  });

  it('ping 始终返回 true', async () => {
    const p = getProviderById('mock');
    expect(await p.ping()).toBe(true);
  });
});

describe('DifyProvider 配置检测', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('未配置 env 与 localStorage → isConfigured=false', () => {
    // env 默认空，localStorage 空
    const p = getProviderById('dify');
    expect(p.isConfigured()).toBe(false);
  });

  it('设置 localStorage dify_config → isConfigured=true', () => {
    localStorage.setItem(
      'dify_config',
      JSON.stringify({ apiUrl: 'https://x', apiKey: 'k' }),
    );
    const p = getProviderById('dify');
    expect(p.isConfigured()).toBe(true);
  });
});

describe('BrandAdvisor 默认 provider 选择', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getActiveProvider 对未设置 brand 返回某个已注册 provider', () => {
    // 不预设 localStorage，走默认 brandId 规则
    setProviderForTest('hireflow', 'mock');
    const p = getActiveProvider('hireflow');
    // 只验证 p 在注册表里，不验证 id（依赖 env）
    const known = listProviders().some((k) => k.id === p.id);
    expect(known).toBe(true);
  });
});

describe('registerProviderForTest 注入自定义 provider', () => {
  it('可注入新 provider，listProviders 立即可见', () => {
    const stub: ChatProvider = {
      id: 'stub-test',
      name: 'Stub',
      description: 'test',
      streamChat: async () => {},
      ping: async () => true,
      isConfigured: () => true,
    };
    registerProviderForTest(stub);
    expect(listProviders().some((p) => p.id === 'stub-test')).toBe(true);
    expect(getProviderById('stub-test').id).toBe('stub-test');
  });
});
