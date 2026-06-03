
            import { createClient } from "@supabase/supabase-js";

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

            if (!supabaseUrl || !supabaseAnonKey) {
              // eslint-disable-next-line no-console
              console.warn(
                "[supabase] VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 未配置；Supabase 客户端将以占位值创建，所有调用都会失败。请在 .env 中填值。"
              );
            }

            export const supabase = createClient(supabaseUrl, supabaseAnonKey);
            