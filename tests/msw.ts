/**
 * MSW (Mock Service Worker) - Node 环境（vitest）共用 server
 *
 * 在每个测试文件可直接 import { server, http, HttpResponse } 来声明 handler
 */
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

/** 全局 server 实例（在 tests/setup.ts 启动） */
export const server = setupServer();

export { http, HttpResponse };
