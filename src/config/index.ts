/**
 * 品牌切换器 — 在 main.tsx 中调用 applyBrandTheme() 把当前 brand 的 CSS 变量写入 :root
 */
import { brand } from "./brand";

export function applyBrandTheme(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const { theme } = brand;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-light", theme.primaryLight);
  root.style.setProperty("--primary-glow", theme.primaryGlow);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--ring", theme.primary);

  // 同步页面标题
  if (brand.name && document.title) {
    document.title = `${brand.name} · ${brand.tagline}`;
  }
}

export { brand } from "./brand";
export type { BrandConfig } from "./brand";