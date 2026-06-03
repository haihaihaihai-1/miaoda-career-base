import type { BrandConfig } from "../brand";

/**
 * default — 秒哒原始「职业路径规划助手」配置
 * 对应业务领域：中国职业院校学生职业测评与学习路径生成
 */
export const defaultBrand: BrandConfig = {
  id: "default",
  name: "职业路径导航器",
  tagline: "专业测评 · 学习路径 · AI 顾问",
  description:
    "一站式职业指导平台，提供职业测评、学习路径生成、1+X 证书规划、AI 职业顾问对话，面向高校学生与职场新人。",
  keywords: ["职业测评", "职业规划", "求职指导", "1+X 证书", "学习路径", "AI 顾问"],

  domain: "career",

  audience: {
    primary: "中国高职院校在校学生",
    persona:
      "大一至大四学生，专业涵盖计算机、人工智能、数据科学、电商等，希望明确职业目标并获得学习指引",
  },

  theme: {
    primary: "221 79% 48%",
    primaryLight: "221 79% 58%",
    primaryGlow: "221 79% 66%",
    accent: "221 79% 96%",
  },

  copy: {
    tab1Title: "首页",
    tab2Title: "测评",
    tab3Title: "发现",
    tab4Title: "我的",
    heroTitle: "找到属于你的职业路径",
    heroSubtitle: "6 步问卷 · 3 阶段学习路径 · AI 顾问全程陪伴",
    ctaPrimary: "立即开始测评",
    wizardIntro: "请如实填写以下信息，系统将为你生成专属学习路径",
  },

  features: {
    aiAdvisor: true,
    pdfReport: true,
    shareCard: true,
    certBanner: true,
    hiringPanel: true,
    difyPanel: true,
  },

  links: {
    help: "https://cloud.baidu.com/doc/MIAODA/s/Xmewgmsq7",
  },
};
