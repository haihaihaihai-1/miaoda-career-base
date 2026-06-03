/**
 * Service Worker 注册器
 * - 仅生产环境注册（避免开发环境干扰 HMR）
 * - 支持通过环境变量禁用：VITE_DISABLE_SW=1
 */

const SW_URL = '/sw.js';

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // 开发环境不启用（避免 vite HMR 冲突）
  if (import.meta.env.DEV) return;

  if (import.meta.env.VITE_DISABLE_SW === '1') return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_URL, { scope: '/' })
      .then((reg) => {
        // 发现新版本时提示（最小化：自动激活）
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              // 已存在旧 SW 控制页面 → 立即升级
              nw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {
        // 注册失败静默；可由 observability.captureException 接管
      });
  });
}

/** 主动取消注册（用于测试 / 用户登出后清缓存） */
export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
}
