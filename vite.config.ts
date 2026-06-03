import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    target: "es2020",
    sourcemap: mode !== "production",
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // @sentry/react 是可选依赖（仅在 VITE_SENTRY_DSN 配置时使用），
      // 显式声明 external 让 rollup 跳过解析，避免未装包时构建失败
      external: ["@sentry/react", "@sentry/tracing"],
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          "charts": ["recharts"],
          "pdf-export": ["jspdf", "html2canvas"],
          "supabase": ["@supabase/supabase-js"],
          "forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "query": ["@tanstack/react-query"],
        },
      },
    },
  },
}));
