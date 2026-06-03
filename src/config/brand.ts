/**
 * 品牌抽象层 — 派生产品的"换皮"接口
 *
 * 通过环境变量 VITE_BRAND 在构建/运行时切换品牌，业务页面通过 useBrand() 读取。
 * 各派生 brand 文件位于 ./brands/，请保持字段一致以确保切换无破坏。
 */

import { defaultBrand } from "./brands/default";
import { hireflowBrand } from "./brands/hireflow";
import { teachingBrand } from "./brands/teaching";
import { campusBrand } from "./brands/campus";
import { laiLuBrand } from "./brands/lai-lu";

export interface BrandConfig {
  /** 唯一标识 */
  id: string;
  /** 应用显示名 */
  name: string;
  /** 副标题 / Tagline */
  tagline: string;
  /** SEO meta description */
  description: string;
  /** SEO keywords */
  keywords: string[];

  /** 业务领域 */
  domain: "career" | "hiring" | "teaching" | "campus" | "general";
  /** 用户画像 */
  audience: {
    primary: string;
    persona: string;
  };

  /** 主题色（HSL，会覆盖 :root CSS 变量） */
  theme: {
    /** 主色 hsl 字符串，例如 "221 79% 48%" */
    primary: string;
    primaryLight: string;
    primaryGlow: string;
    accent: string;
  };

  /** 文案覆盖 */
  copy: {
    /** Tab 1（首页）标题 */
    tab1Title: string;
    /** Tab 2（测评/向导）标题 */
    tab2Title: string;
    /** Tab 3（发现/资源）标题 */
    tab3Title: string;
    /** Tab 4（我的）标题 */
    tab4Title: string;
    /** Hero 主标题 */
    heroTitle: string;
    /** Hero 副标题 */
    heroSubtitle: string;
    /** CTA 按钮文案 */
    ctaPrimary: string;
    /** 问卷向导首页文案 */
    wizardIntro: string;
  };

  /** 功能开关 */
  features: {
    /** 启用 AI 顾问悬浮按钮 */
    aiAdvisor: boolean;
    /** 启用 PDF 报告导出 */
    pdfReport: boolean;
    /** 启用分享卡片 */
    shareCard: boolean;
    /** 启用 1+X 证书提醒 */
    certBanner: boolean;
    /** 启用公司招聘面板 */
    hiringPanel: boolean;
    /** 启用 Dify 配置面板 */
    difyPanel: boolean;
  };

  /** 外链 */
  links: {
    /** 资源中心外链 */
    externalResource?: string;
    /** 帮助文档 */
    help?: string;
    /** 隐私政策 */
    privacy?: string;
  };
}

const registry: Record<string, BrandConfig> = {
  default: defaultBrand,
  hireflow: hireflowBrand,
  teaching: teachingBrand,
  campus: campusBrand,
  "lai-lu": laiLuBrand,
};

/** 从环境变量读取当前激活的 brand，找不到则回退 default */
export function getActiveBrand(): BrandConfig {
  const brandId = (import.meta.env.VITE_BRAND ?? "default").toLowerCase();
  return registry[brandId] ?? defaultBrand;
}

/** 列出所有已注册 brand（调试/切换器使用） */
export function listBrands(): BrandConfig[] {
  return Object.values(registry);
}

/** 当前激活 brand 的单例 */
export const brand = getActiveBrand();
