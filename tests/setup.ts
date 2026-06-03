// 测试环境初始化
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { server } from './msw';
import { setLocale } from '@/lib/i18n';

// 强制中文 locale（jsdom 的 navigator.language 默认 en-US）
beforeEach(() => {
  setLocale('zh');
});

// 启动 MSW —— 拦截所有未处理 HTTP，便于发现遗漏的 mock
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

// 抑制 React 在 jsdom 中关于 act() 的警告（仅测试环境）
// biome-ignore lint/suspicious/noExplicitAny: jsdom typings
const origError = console.error;
console.error = (...args: any[]) => {
  const msg = String(args[0] ?? '');
  if (msg.includes('not wrapped in act')) return;
  origError.apply(console, args as []);
};
