/**
 * Service Worker - 简易 PWA 离线策略
 *
 * 策略：
 *   - 安装时预缓存核心壳（offline.html / manifest / icons）
 *   - 静态资产（/assets/*）：cache-first + 后台更新
 *   - 导航请求 (HTML)：network-first + cache fallback → 最后回退 offline.html
 *   - API 请求 (/api/* 等)：network-only（避免脏数据）
 *
 * 注意：本文件由浏览器直接执行，不走打包；只能用 ES2020+ 原生 API。
 */
const CACHE_NAME = 'miaoda-career-base-v2';
const OFFLINE_URL = '/offline.html';
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg',
  OFFLINE_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** 判断是否跳过 SW（API / 跨域 / 非 GET） */
function shouldBypass(request) {
  if (request.method !== 'GET') return true;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname.startsWith('/auth/')) return true;
  // Supabase / Dify / 监控端点不缓存
  if (url.searchParams.has('no-cache')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (shouldBypass(request)) return;

  // 导航请求：network-first；离线 → cache → offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((r) => r || caches.match('/') || caches.match(OFFLINE_URL)),
        ),
    );
    return;
  }

  // 静态资产：cache-first + 后台更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});

// 收到 main thread 的 SKIP_WAITING 消息 → 立即激活
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
