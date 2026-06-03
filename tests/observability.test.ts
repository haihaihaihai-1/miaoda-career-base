/**
 * observability lib 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  captureException,
  logEvent,
  setUserContext,
  flush,
  registerAdapter,
  resetAdapter,
  initObservability,
} from '@/lib/observability';

describe('observability default (console adapter)', () => {
  beforeEach(() => {
    resetAdapter();
  });

  it('captureException 不抛出', () => {
    expect(() => captureException(new Error('x'))).not.toThrow();
  });

  it('logEvent 不抛出', () => {
    expect(() => logEvent('test.event', { foo: 'bar', n: 1 })).not.toThrow();
  });

  it('setUserContext null 不抛出', () => {
    expect(() => setUserContext(null)).not.toThrow();
  });

  it('flush 返回 Promise 且 resolve', async () => {
    await expect(flush()).resolves.toBeUndefined();
  });

  it('initObservability 注入 brand context', () => {
    expect(() => initObservability('hireflow')).not.toThrow();
  });
});

describe('custom adapter', () => {
  beforeEach(() => {
    resetAdapter();
  });

  it('registerAdapter 后转发调用', () => {
    const exc = vi.fn();
    const ev = vi.fn();
    const usr = vi.fn();
    const fl = vi.fn(() => Promise.resolve());

    registerAdapter({
      captureException: exc,
      logEvent: ev,
      setUserContext: usr,
      flush: fl,
    });

    captureException('err', { foo: 'bar' });
    logEvent('e1', { a: 1 });
    setUserContext({ id: 'u' });

    expect(exc).toHaveBeenCalledWith('err', { foo: 'bar' });
    expect(ev).toHaveBeenCalledWith('e1', { a: 1 });
    expect(usr).toHaveBeenCalledWith({ id: 'u' });
  });

  it('adapter 抛错不影响业务', () => {
    registerAdapter({
      captureException: () => {
        throw new Error('boom');
      },
      logEvent: () => {
        throw new Error('boom');
      },
      setUserContext: () => {
        throw new Error('boom');
      },
    });

    expect(() => captureException(new Error('x'))).not.toThrow();
    expect(() => logEvent('e')).not.toThrow();
    expect(() => setUserContext({ id: 'x' })).not.toThrow();
  });

  it('resetAdapter 恢复默认', async () => {
    const fl = vi.fn(() => Promise.resolve());
    registerAdapter({
      captureException: () => {},
      logEvent: () => {},
      setUserContext: () => {},
      flush: fl,
    });
    await flush();
    expect(fl).toHaveBeenCalled();

    resetAdapter();
    fl.mockClear();
    await flush();
    expect(fl).not.toHaveBeenCalled(); // 已回到 console
  });
});
