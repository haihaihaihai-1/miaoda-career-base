import type { BrandConfig } from "../brand";

/**
 * teaching — AI 助教 / 教学网站学情助手
 * 对应 workspace: assistant-teaching-website / ai-assistant-teaching-website
 *
 * 复用：AIAdvisorWidget / DifyConfigCard / data/courses.ts / HomePage 时间轴
 * 改造：把"职业路径"替换为"课程学情"，接入现有教学网站后端 API
 */
export const teachingBrand: BrandConfig = {
  id: "teaching",
  name: "AI 学情助手",
  tagline: "课程进度 · 知识点答疑 · 个性化路径",
  description:
    "面向教学场景的 AI 学情助手，跟踪学习进度、提供知识点答疑、生成个性化学习路径，融入现有教学网站。",
  keywords: ["AI 助教", "学情分析", "学习路径", "个性化教学", "答疑"],

  domain: "teaching",

  audience: {
    primary: "在校学生 / 教师 / 教学管理者",
    persona:
      "需要看清课程进度、获得即时答疑、收到个性化学习建议的学生；以及监督学情、优化教学的教师",
  },

  theme: {
    primary: "160 84% 39%",
    primaryLight: "160 84% 49%",
    primaryGlow: "160 84% 60%",
    accent: "160 84% 96%",
  },

  copy: {
    tab1Title: "学情",
    tab2Title: "测验",
    tab3Title: "课程",
    tab4Title: "我的",
    heroTitle: "让 AI 成为你的随身助教",
    heroSubtitle: "跟踪进度 · 即时答疑 · 个性化学习路径",
    ctaPrimary: "查看我的学情",
    wizardIntro: "请填写你正在学习的课程与学习目标，AI 助教将为你定制路径",
  },

  features: {
    aiAdvisor: true,
    pdfReport: true,
    shareCard: false,
    certBanner: false,
    hiringPanel: false,
    difyPanel: true,
  },

  links: {
    help: "/docs/teaching",
  },
};
