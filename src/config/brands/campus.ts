import type { BrandConfig } from "../brand";

/**
 * campus — 校园 Agent 学生端
 * 对应 workspace: campus-agent / xmxc-knowledge-base
 *
 * 复用：整套 4-Tab 框架 + AppContext + Supabase schema
 * 改造：新增校园场景 Tab（如"今日任务"/"校园问答"），整合校园知识库
 */
export const campusBrand: BrandConfig = {
  id: "campus",
  name: "校园智能助手",
  tagline: "校园问答 · 学业规划 · 生活服务",
  description:
    "面向高校学生的智能助手，整合校园知识库（xmxc）、学业规划、生活服务与 AI 问答，一站式校园伙伴。",
  keywords: ["校园助手", "学生 Agent", "学业规划", "校园问答", "xmxc"],

  domain: "campus",

  audience: {
    primary: "在校大学生",
    persona:
      "需要查询校园通知、办事流程、课程规划、生活服务并与 AI 助手对话的在校学生",
  },

  theme: {
    primary: "38 92% 50%",
    primaryLight: "38 92% 60%",
    primaryGlow: "38 92% 68%",
    accent: "38 92% 96%",
  },

  copy: {
    tab1Title: "首页",
    tab2Title: "问答",
    tab3Title: "服务",
    tab4Title: "我的",
    heroTitle: "你的校园智能伙伴",
    heroSubtitle: "通知 · 选课 · 答疑 · 生活全在一个 App",
    ctaPrimary: "开始使用",
    wizardIntro: "请告诉我你的专业与年级，让我更好地为你服务",
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
    help: "/docs/campus",
  },
};
