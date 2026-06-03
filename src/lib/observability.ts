/**
 * Observability - 错误捕获 + 性能/事件追踪的统一抽象
 *
 * 设计：
 *   - 默认 console 输出（开发友好）
 *   - 生产环境若配置 VITE_SENTRY_DSN，可注册 Sentry adapter
 *   - 业务代码统一调 captureException / logEvent / setUserContext
 *
 * 实际 Sentry SDK 装包较重（~200KB），按需在派生中接入；
 * 本基座只暴露接口 + console fallback。
 */

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  brand?: string;
  [k: string]: unknown;
}

export interface EventProps {
  [k: string]: string | number | boolean | undefined | null;
}

export interface ObservabilityAdapter {
  captureException(err: unknown, ctx?: EventProps): void;
  logEvent(name: string, props?: EventProps): void;
  setUserContext(user: UserContext | null): void;
  flush?(): Promise<void>;
}

/** 默认 console adapter（开发 + 兜底） */
class ConsoleAdapter implements ObservabilityAdapter {
  captureException(err: unknown, ctx?: EventProps): void {
    // eslint-disable-next-line no-console
    console.error('[observability] exception', { err, ctx });
  }
  logEvent(name: string, props?: EventProps): void {
    // eslint-disable-next-line no-console
    console.info(`[observability] ${name}`, props ?? {});
  }
  setUserContext(user: UserContext | null): void {
    // eslint-disable-next-line no-console
    console.debug('[observability] user', user);
  }
  async flush(): Promise<void> {
    /* noop */
  }
}

let activeAdapter: ObservabilityAdapter = new ConsoleAdapter();

/** 注册自定义 adapter（如 Sentry / Datadog） */
export function registerAdapter(adapter: ObservabilityAdapter): void {
  activeAdapter = adapter;
}

/** 切换回 console（测试 / 重置） */
export function resetAdapter(): void {
  activeAdapter = new ConsoleAdapter();
}

export function captureException(err: unknown, ctx?: EventProps): void {
  try {
    activeAdapter.captureException(err, ctx);
  } catch {
    /* noop —— observability 失败不应影响业务 */
  }
}

export function logEvent(name: string, props?: EventProps): void {
  try {
    activeAdapter.logEvent(name, props);
  } catch {
    /* noop */
  }
}

export function setUserContext(user: UserContext | null): void {
  try {
    activeAdapter.setUserContext(user);
  } catch {
    /* noop */
  }
}

export async function flush(): Promise<void> {
  try {
    await activeAdapter.flush?.();
  } catch {
    /* noop */
  }
}

/**
 * Sentry adapter 占位 —— 真实接入需先 `npm i @sentry/react`
 * 演示如何 wire：
 *
 *   import * as Sentry from '@sentry/react';
 *   Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
 *   registerAdapter({
 *     captureException: (e, ctx) => Sentry.captureException(e, { extra: ctx }),
 *     logEvent: (n, p) => Sentry.captureMessage(n, { extra: p }),
 *     setUserContext: (u) => Sentry.setUser(u),
 *     flush: () => Sentry.flush(2000),
 *   });
 */
export function initObservability(brandId: string): void {
  // 这里只做最小化：设 brand context
  setUserContext({ brand: brandId });
  logEvent('app.boot', { brand: brandId });
}
