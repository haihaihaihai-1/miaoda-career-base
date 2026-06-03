/**
 * Sentry adapter - 真接入指南 + 自动 wire
 *
 * 使用方式：
 *   1. `npm i @sentry/react @sentry/tracing` (注意：此基座未默认引入)
 *   2. 在 main.tsx 末尾添加：
 *      import { wireSentry } from '@/lib/sentryAdapter';
 *      wireSentry(); // 自动检测 VITE_SENTRY_DSN 并接入
 *
 * 在未装包或未配置 DSN 时，wireSentry() 静默 no-op；
 * observability 会继续使用默认 console adapter。
 */
import { registerAdapter, type ObservabilityAdapter } from './observability';

/** 检查环境变量是否启用 Sentry */
export function shouldEnableSentry(): boolean {
  return !!import.meta.env.VITE_SENTRY_DSN;
}

/**
 * 实际接入函数（lazy import 避免基座默认依赖 sentry SDK）
 *
 * 工作方式：
 *   - 若 @sentry/react 已安装且 VITE_SENTRY_DSN 已配置 → 初始化并注册 adapter
 *   - 否则 → 静默跳过
 */
export async function wireSentry(): Promise<void> {
  if (!shouldEnableSentry()) return;
  if (typeof window === 'undefined') return;

  try {
    // 运行时动态加载，未装包时这条 import 会失败，被 catch 接住
    // @vite-ignore 防止 vite 静态分析时报 unresolved import 错
    const Sentry = await import(/* @vite-ignore */ '@sentry/react' as string).catch(
      () => null,
    );
    if (!Sentry || !('init' in Sentry)) {
      // eslint-disable-next-line no-console
      console.warn('[sentry] VITE_SENTRY_DSN 已配置但未安装 @sentry/react，跳过');
      return;
    }

    // biome-ignore lint/suspicious/noExplicitAny: dynamic import typing
    const S = Sentry as any;
    S.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_RATE ?? '0.2'),
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });

    const adapter: ObservabilityAdapter = {
      captureException: (e, ctx) => {
        try {
          S.captureException(e, ctx ? { extra: ctx } : undefined);
        } catch {
          /* noop */
        }
      },
      logEvent: (name, props) => {
        try {
          S.captureMessage(name, { level: 'info', extra: props ?? {} });
        } catch {
          /* noop */
        }
      },
      setUserContext: (user) => {
        try {
          S.setUser(user);
        } catch {
          /* noop */
        }
      },
      flush: async () => {
        try {
          await S.flush(2000);
        } catch {
          /* noop */
        }
      },
    };
    registerAdapter(adapter);
    // eslint-disable-next-line no-console
    console.info('[sentry] adapter wired');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[sentry] wireSentry failed', e);
  }
}
