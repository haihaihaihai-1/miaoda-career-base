import type { BrandConfig } from "../brand";

/**
 * lai-lu — Lai-Lu 垂直产品交付（G6）
 *
 * 对应 workspace: lai-lu/
 * 占位骨架，待业务负责人对齐后细化文案与功能
 */
export const laiLuBrand: BrandConfig = {
  id: "lai-lu",
  name: "Lai-Lu",
  tagline: "智能服务 · 持续交付",
  description: "Lai-Lu 垂直产品，基于 miaoda-career-base 多产品基座派生。",
  keywords: ["Lai-Lu", "智能服务", "AI 助手"],

  domain: "general",

  audience: {
    primary: "Lai-Lu 目标用户",
    persona: "（待业务负责人补充）",
  },

  theme: {
    primary: "330 70% 50%",
    primaryLight: "330 70% 60%",
    primaryGlow: "330 70% 70%",
    accent: "330 70% 96%",
  },

  copy: {
    tab1Title: "首页",
    tab2Title: "服务",
    tab3Title: "发现",
    tab4Title: "我的",
    heroTitle: "Lai-Lu · 智能服务",
    heroSubtitle: "（待业务文案补充）",
    ctaPrimary: "开始使用",
    wizardIntro: "请填写基础信息以启用 Lai-Lu 服务",
  },

  features: {
    aiAdvisor: true,
    pdfReport: false,
    shareCard: true,
    certBanner: false,
    hiringPanel: false,
    difyPanel: true,
  },

  links: {
    help: "/docs/lai-lu",
  },
};
