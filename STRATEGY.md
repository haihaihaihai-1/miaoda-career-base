# 战略对齐 · miaoda-career-base ↔ G1-G7

> 本文档将 `miaoda-career-base` 在 [CLAUDE.md](../CLAUDE.md) 战略目标矩阵中的定位说清楚。

## 一、CLAUDE.md 战略目标回顾

| ID | 战略目标 |
|---|---|
| **G1** | 自主编程平台（HireFlow 核心） |
| **G2** | 智能体循环引擎（Agentic Loop） |
| **G3** | 代码执行引擎（Code Action） |
| **G4** | 智能技能引擎（Smart Skill） |
| **G5** | 方法论内化（Superpowers Integration） |
| **G6** | 垂直产品交付（Lai-Lu） |
| **G7** | 基础设施与运维 |

## 二、miaoda-career-base 的角色定位

> **「成熟权威前端基座 + 多业务派生层」** — 不在任何一条业务线的关键路径上，但是几乎所有面向用户的产品的**前端底盘**。

```
┌─────────────────────────────────────────────────────────────────┐
│             miaoda-career-base （单仓库多产品基座）             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  四层资产： UI / 业务积木 / 领域逻辑 / 后端契约           │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↑               ↑               ↑               ↑       │
│    derivatives/    derivatives/    derivatives/    derivatives/ │
│     hireflow        teaching         campus          lai-lu     │
│        ↓               ↓               ↓               ↓        │
│       G1            (生态)          (生态)            G6        │
└─────────────────────────────────────────────────────────────────┘
                            ↑
                            │ 工程化基线（CI/Docker/Lint/Brand）
                            │
                          → G7 基础设施
```

## 三、逐目标映射

### G1 · HireFlow 自主编程平台 → **强相关**

- `derivatives/hireflow/SPEC.md` 是 HireFlow 候选人评估前端的官方规范
- 直接复用 RadarChart5D / WizardPage / pdfReport / difyApi
- 与 `dual_tower/` 双塔匹配、`HireFlow_*.md` 架构文档形成闭环
- **下一步动作**：按 SPEC checklist 落地 brand=hireflow 的最小可演示版本

### G2 · 智能体循环引擎 → **弱相关（消费方）**

- 本基座**不实现** Agentic Loop，但是 Loop 输出的成果（评估报告 / 学情建议 / 校园答案）的"前端展示层"
- AIAdvisorWidget + difyApi 是 agent 对话的 UI 出口
- **建议**：在 Loop 引擎稳定后，把 `services/agenticLoop.ts` 客户端 SDK 接入

### G3 · 代码执行引擎 → **无关**

- Code Action 属于 backend / sandbox，与前端基座解耦
- 唯一交集：如果有"AI 写代码 → 在网页内执行"演示，可在基座加 `<CodeRunner />` 组件

### G4 · 智能技能引擎 → **元相关**

- 基座本身是 Skill 的产物（参考 architecture-designer / frontend-design / clawhub 等技能）
- `derivatives/` 模式可启发"Skill 派生"机制（一个 base skill + N 个 brand override）

### G5 · 方法论内化（Superpowers） → **强相关**

- 本次大规模推进**严格遵循 7 阶段流程**：brainstorming（用户对齐）→ writing-plans（todo）→ subagent-driven（多文件并行）→ TDD（typecheck 卡口）→ code-review → verification
- Iron Law 体现：
  - ✅ 改 supabase.ts 之前先有 typecheck 失败信号
  - ✅ 移除 miaoda-sc-plugin 之前先 grep 验证根因
  - ✅ 每个 Phase 完成都跑 typecheck/build 验证
- Red Flags 触发：
  - 单文件 > 500 行 → src/components/ui/sidebar.tsx 已 23 KB，未来拆
  - tailwind.config.js 142 行 → 可接受（声明式）

### G6 · 垂直产品交付（Lai-Lu） → **路线已铺**

- `derivatives/` 模式即「同基座，多垂直」的产品交付方法论
- Lai-Lu 派生（lai-lu brand）暂未起草 SPEC —— **下一步动作**：与 Lai-Lu 业务负责人对齐后补
- 复用收益：每个 Lai-Lu 子产品省下 ~80% 前端基础投入

### G7 · 基础设施与运维 → **基线就位**

| 基础设施项 | 状态 |
|---|---|
| Dockerfile 多阶段构建 | ✅ |
| GitHub Actions CI（5 brand matrix + Docker smoke test + 单测） | ✅ |
| commitlint.config.cjs + husky hooks | ✅（独立 git repo 后启用） |
| .env.example + .gitignore 安全合规 | ✅ |
| nginx SPA fallback + healthz | ✅ |
| 代码拆包（manualChunks 8 chunk） | ✅ |
| 类型严格度（tsconfig.check.json） | ✅ |
| Biome lint 配置（0 warnings） | ✅ |
| Vitest 测试基础设施（jsdom + Testing Library + MSW） | ✅ |
| 多步表单抽象（WizardShell + useWizardDraft） | ✅ |
| PDF 水印 + Token 追溯 | ✅ |
| PWA 元数据（manifest + icons + theme-color） | ✅ |
| Service Worker（cache-first 静态 + network-first 导航 + API 直通） | ✅ |
| Supabase Auth（OTP + OAuth + AuthGate） | ✅ |
| Observability 抽象（captureException / logEvent / Sentry adapter 占位） | ✅ |
| 暗黑模式 + 轻量 i18n | ✅ |
| **缺**：Playwright E2E、Sentry SDK 实际接入、Storybook | ⏳ |

## 四、整体优先级清单（下一阶段）

按价值密度排序的 6 件事：

1. ~~**激活 hireflow brand**~~ ✅ **已完成**（types + service + 21 单测 + Supabase migration + 5 步 Wizard + Home/雷达/Gap UI + brand 路由 + CI matrix）。**对齐 G1。**
2. ~~**打通 dual_tower 双塔**~~ ✅ **抽象层完成**：`services/dualTower.ts`（DualTowerClient 接口 + Mock + HTTP 实现 + 19 单测），AssessmentHome 已展示 top-3 推荐岗位。**对齐 G1 + G2。** ⏳ 仍需为 hireflow 训练专属双塔模型（workspace dual_tower 实为蛋白序列领域，仅作架构参考）。
3. ~~**接入 ai-assistant-teaching-website**~~ ✅ **端到端可演示**：
   - ✅ `services/teachingLLM.ts`（SSE）+ `services/teachingAPI.ts`
   - ✅ `pages/teaching/LearningHome.tsx`（进度卡 + 弱项 + AI 助教流式对话）
   - ✅ App.tsx brand 分发 → `VITE_BRAND=teaching npm run dev` 直接出页面
4. ~~**husky + commitlint 落地**~~ ✅ **已完成**。**对齐 G7。**
5. **E2E 测试（Playwright）** — 跑 5 个 brand 的 smoke test。**对齐 G5 + G7。** ⏳
6. **Lai-Lu brand 起草** — 与业务对齐后补 `derivatives/lai-lu/SPEC.md`。**对齐 G6。**
   - ✅ brand 占位 + SPEC 模板
   - ⏳ 业务负责人对齐

### 已完成的"附加价值"

- ✅ **AI 案例题评分（`services/aiScoring.ts`）**：替换 Wizard 的长度启发式占位为"Dify 优先 + 启发式 fallback"，9 个单测，对齐 G2/G4。
- ✅ **Supabase 持久层（`services/hireflowDB.ts`）**：候选人/评估 CRUD + RLS-friendly + 数据源 badge（DB/Mock） + **真写入闭环**（hireflow Index onComplete 已接 createCandidate）。
- ✅ **暗黑模式（`components/ThemeToggle.tsx`）**：纯 classList + localStorage，零额外依赖，跟随系统。
- ✅ **运行时 i18n（`lib/i18n.ts`）**：zh/en 字典 + brand.copy 优先 + setLocale 监听 + `useLocale` Hook + `LanguageToggle` 组件 + 10 单测。
- ✅ **WizardShell 抽象（`components/wizard/`）**：可复用多步表单容器 + `useWizardDraft` localStorage 草稿恢复（10 测）。
- ✅ **HireflowWizard 迁移到 WizardShell**：声明式 step 配置 + 草稿自动保存 + Demo 数据一键填充，缩减 ~150 行，验证抽象有效。
- ✅ **campus brand 完整 UI**：CampusHome + 悬浮 RAG 问答 + SchedulePage 周课表 + ServicesPage 12 服务搜索/分类。
- ✅ **teaching brand 二级页**：CoursePage 课程详情 + KnowledgeGapPage 弱项总览。
- ✅ **lai-lu brand 占位首页**：LaiLuHome（Hero + 3 特性卡片 + 占位说明） + Index 容器 + brand 路由分发。
- ✅ **PDF 水印（`lib/pdfWatermark.ts`）**：8 个单测，已集成到 `pdfReport.ts` 与 hireflow `lib/hireflowPdfReport.ts`。
- ✅ **Hireflow 报告 PDF（`lib/hireflowPdfReport.ts`）**：封面 + 5 维 + Gap + 案例附录 + 全页水印 + token 追溯 + 4 单测 + AssessmentHome "导出 PDF"按钮。
- ✅ **MSW 测试基础设施（`tests/msw.ts`）**：替换 `vi.stubGlobal`，已用于 `dualTowerHttp.test.ts` 拦截 HTTP 请求（7 测）。
- ✅ **PWA 元数据**：`public/manifest.webmanifest` + `icon-192/512.svg` + apple-touch-icon + theme-color + viewport-fit。
- ✅ **Service Worker 离线**：`public/sw.js` cache-first 静态 / network-first 导航 / API 直通 + `offline.html` 友好降级 + `lib/registerServiceWorker.ts` 生产注册 + `NetworkStatusBanner` 实时网络提示。
- ✅ **Supabase Auth 体系**：`useAuth` hook + `SignInPage`（Email OTP + Google/GitHub OAuth）+ `AuthGate`（按 brand 强制登录）+ `UserMenu`（头像/登出/资料/演示模式提示）+ 7 个测试。
- ✅ **Observability 抽象（`lib/observability.ts`）**：captureException / logEvent / setUserContext 统一接口，console 默认 adapter + Sentry 占位 + 8 单测，hireflow Wizard 与 PDF 导出均已埋点。
- ✅ **第 7 轮 · ChatProvider 抽象 + Sentry 真实接入 + 真 Supabase 评估写入**：
  - `services/aiProvider.ts` —— 4 provider（mock / dify / teaching / campus）+ 工厂 + 运行时切换 + 持久化偏好 + 12 单测
  - `components/ai/BrandAdvisor.tsx` —— 按 brand 调度 provider；default brand 走原 AIAdvisorWidget，其他 brand 走通用 ChatWidget
  - `components/ai/ChatWidget.tsx` —— 通用流式浮动 widget，brand + provider 隔离历史
  - `components/ai/ChatProviderCard.tsx` —— 运行时切换 / Ping 检查面板，已挂入 UserMenu 下拉
  - `lib/sentryAdapter.ts` —— 自动检测 `VITE_SENTRY_DSN` + 动态 import `@sentry/react`（未装包时静默 no-op），`main.tsx` 已调 `wireSentry()`
  - `AssessmentWizard.onComplete` 签名升级为 `WizardCompletion = { candidate, assessment }`，可同时持久化 candidate + assessment
  - `hireflow Index.handleComplete` 已用 `persistCandidateWithAssessment` 真写 Supabase（带回退到本地）
  - 移动端响应式：hireflow / lai-lu / campus header 增加 `flex-wrap` + 窄屏隐藏/缩写
  - 构建修复：`vite.config.ts` `external: ['@sentry/react', '@sentry/tracing']` 避免 rollup 解析未装包的可选依赖
  - 测试：11 文件 / 115 测全绿；5 brand 8.3-8.8s 全部 build 成功（11 chunks，无警告）
- ⏳ **第 8 轮候选**：Lai-Lu SPEC 落地、Playwright E2E、hireflow 训练专属双塔模型

## 五、风险登记

| 风险 | 影响 | 缓解 |
|---|---|---|
| derivatives/ 增多导致 main 仓库膨胀 | 中 | 考虑 monorepo（pnpm workspace），每个 brand 独立打包入口 |
| brand 切换只覆盖 CSS 变量与文案，业务逻辑差异仍需代码分支 | 中 | 在 App.tsx 实现 `brand.id` 路由分流；必要时 lazy-load 整页 |
| PDF / Share 模块在不同 brand 下隐私合规要求差异（HireFlow 涉 PII） | 高 | 在 `features.shareCard` 关闭时彻底卸载组件；PDF 加水印 |
| Supabase anon key 在公网暴露 | 中 | 严格 RLS；敏感操作走 Edge Function（service_role 仅在服务端） |
| Dify 服务可用性 | 低 | difyApi 已有超时/降级；可切换 fallback provider |

## 六、变更与可追溯

- 创建：本次大规模推进会话
- 版本：v0.1.0（基座初始就绪）
- 后续：每个 brand 落地里程碑记入本文件 § 四的 checkbox
