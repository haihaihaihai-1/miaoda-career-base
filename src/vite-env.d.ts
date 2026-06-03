/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dify API base URL，例如 https://api.dify.ai/v1 */
  readonly VITE_DIFY_API_URL?: string;
  /** Dify 应用 API Key */
  readonly VITE_DIFY_API_KEY?: string;

  /** Supabase 项目 URL */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) key —— 前端唯一可用密钥 */
  readonly VITE_SUPABASE_ANON_KEY?: string;

  /** 资源中心外链 */
  readonly VITE_EXTERNAL_RESOURCE_URL?: string;

  /** 品牌切换：default | hireflow | teaching | campus | lai-lu */
  readonly VITE_BRAND?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

