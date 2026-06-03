import type { BrandConfig } from "../brand";

/**
 * hireflow — HireFlow 候选人评估前端
 * 对应 CLAUDE.md G1：自主编程平台 / 候选人能力评估
 *
 * 复用：RadarChart5D / WizardPage / pdfReport / CompanyHiringPanel
 * 改造：Student → Candidate，pathAnalysis → competencyAnalysis，career_paths → assessments
 */
export const hireflowBrand: BrandConfig = {
  id: "hireflow",
  name: "HireFlow 候选人评估",
  tagline: "AI 驱动 · 多维能力雷达 · 评估报告",
  description:
    "HireFlow 候选人智能评估系统，通过结构化测评 + AI 面试对话生成多维能力雷达图与可下载 PDF 报告，服务招聘团队科学决策。",
  keywords: ["候选人评估", "AI 招聘", "能力测评", "面试", "雷达图", "HireFlow"],

  domain: "hiring",

  audience: {
    primary: "招聘团队 / HR / 技术面试官",
    persona:
      "需要快速量化候选人技能/软实力分布、对齐岗位胜任力模型、生成可分享评估报告的招聘决策者",
  },

  theme: {
    primary: "262 83% 58%",
    primaryLight: "262 83% 68%",
    primaryGlow: "262 83% 76%",
    accent: "262 83% 96%",
  },

  copy: {
    tab1Title: "候选人",
    tab2Title: "评估",
    tab3Title: "岗位",
    tab4Title: "我的",
    heroTitle: "把面试变成可衡量的数据",
    heroSubtitle: "结构化评估 · 雷达图能力图谱 · PDF 报告一键导出",
    ctaPrimary: "新建候选人评估",
    wizardIntro: "请填写候选人基础信息与目标岗位，系统将生成结构化评估问卷",
  },

  features: {
    aiAdvisor: true,
    pdfReport: true,
    shareCard: true,
    certBanner: false,
    hiringPanel: true,
    difyPanel: true,
  },

  links: {
    help: "/docs/hireflow",
  },
};
