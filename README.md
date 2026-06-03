# miaoda-career-base

> 从秒哒（Miaoda）「职业路径规划助手」模板派生的**独立基座**。已完成 Miaoda 私有依赖剥离，可直接 `npm i && npm run dev` 启动。
>
> 用途：作为**可组装的成熟权威前端基座**，按业务目标派生新产品。

---

## 一、来源与权威性

| 维度 | 说明 |
|---|---|
| 源模板 | 秒哒应用 `app-bmlg4r4jrmyp`（职业路径规划助手） |
| 权威依赖 | shadcn/ui（Radix 系列）、TanStack Query、React Router、Supabase、Dify、Recharts、html2canvas、jspdf |
| 业务领域 | 学生职业测评 → 学习路径生成 → 1+X 证书提醒 → AI 顾问对话 |
| 技术栈 | Vite 5 + React 18 + TypeScript 5 + Tailwind 3 + Biome |

---

## 二、四层可复用资产清单

### A. UI 基座（`src/components/ui/*`）
50+ shadcn/ui 组件已就绪：button / dialog / drawer / form / select / tabs / toast / sidebar / chart 等。
- 配色：`tailwind.config.js` 主色 `#1a56db`
- 暗黑模式：`next-themes` 已接入
- 通知：`sonner` + 自研 `toast`

### B. 业务积木（`src/components/`、`src/pages/`）
| 积木 | 文件 | 价值 |
|---|---|---|
| 6 步问卷向导 | `pages/WizardPage.tsx` | 表单分步收集 + 实时校验 |
| 学习路径时间轴 | `pages/HomePage.tsx` | 3 阶段里程碑 + 状态机 |
| 5D 技能雷达图 | `components/charts/RadarChart5D.tsx` | Recharts 二次封装 |
| PDF 报告导出 | `services/pdfReport.ts` + `utils/downloadUtils.ts` | jspdf + html2canvas |
| 分享卡片 | `components/home/ShareCardModal.tsx` | QR 二维码 + 截图下载 |
| AI 顾问悬浮按钮 | `components/ai/AIAdvisorWidget.tsx` | Dify SSE 流式对话 |
| Dify 配置面板 | `components/profile/DifyConfigCard.tsx` | localStorage 持久化 |
| Confetti 庆祝 | `components/home/ConfettiEffect.tsx` | 完成态视觉反馈 |
| 1+X 证书 Banner | `components/home/CertBanner.tsx` | 节点达成提醒 |
| 公司招聘面板 | `components/CompanyHiringPanel.tsx` | 岗位卡片 + 详情弹窗 |

### C. 领域逻辑（`src/utils/`、`src/data/`、`src/types/`）
- `utils/pathAnalysis.ts` — 学习路径生成算法（gap 分析 + 3 阶段拆解）
- `types/types.ts` — Student / SkillLevel / Course / CareerPath / Milestone 全套类型
- `data/skillLevels.ts` — 中国 8 级职业技能等级标准
- `data/courses.ts` — 计算机/AI/数据科学专业课程库
- `data/jobRoles.ts` — 岗位库（含技能要求 + 薪资）
- `data/reports/*.ts` — 行业报告内容（AI 转型 / 远程办公 / 职场趋势）

### D. 后端契约（`src/db/supabase.ts`、`src/services/`、`supabase/functions/`）
- Supabase 表设计：students / skill_levels / courses / career_paths / milestones
- Edge Functions（仅样例，需自部署）：
  - `supabase/functions/generate-pdf-report/index.ts`
  - `supabase/functions/hire-overview/index.ts`
  - `supabase/functions/hire-statistics/index.ts`
  - `supabase/functions/minimax-chat/index.ts`
  - `supabase/functions/minimax-chat-stream/index.ts`
- Dify 客户端：`services/difyApi.ts`（SSE 流式 + 超时容错）
- 全局状态：`context/AppContext.tsx`（useReducer 模式）

---

## 三、已完成的 Miaoda 解耦

| 清理项 | 处理方式 |
|---|---|
| `miaoda-sc-plugin` 依赖 | 从 `package.json` 移除 |
| `vite.config.ts` 中 `miaodaDevPlugin()` | 移除导入与调用 |
| `vite.config.dev.ts` (注入 GUI/监控/HMR toggle) | 删除（仅 Miaoda 平台运行需要） |
| `.rules/` 私有 lint 脚本 | 删除 |
| `sgconfig.yml` (ast-grep) | 排除迁入 |
| `package.json` 占位 `dev`/`build` 脚本 | 改回真实 `vite` 命令 |
| `tsgo -p tsconfig.check.json` | 改为 `tsc --noEmit -p tsconfig.check.json` |
| `components.json` 错误指向 `tailwind.config.ts` | 改为 `.js` |
| `ShareCardModal.tsx` 硬编码 `app-bmlg4r4jrmyp.appmiaoda.com` | 改为 `window.location.origin` |
| `ResourcesSection.tsx` 硬编码 `miaoda.cn` | 改为 `VITE_EXTERNAL_RESOURCE_URL` 可配置 |
| `.env` 误带 `VITE_SUPABASE_SERVICE_KEY` | **剥离**，service_role 严禁前端使用 |
| `index.html` `<meta author="miaoda">` | 改为 `miaoda-career-base` |

---

## 四、快速启动

```bash
cd "E:\我的世界java测试版\miaoda-career-base"
npm i                      # 或 pnpm i / yarn
cp .env.example .env       # 复制并填值
npm run dev                # http://127.0.0.1:5173
```

可用脚本：

| 脚本 | 作用 |
|---|---|
| `npm run dev` | Vite 开发服务器（127.0.0.1:5173） |
| `npm run typecheck` | 仅类型检查 |
| `npm run lint` | Biome 静态检查 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览生产构建 |

---

## 五、派生路线图（按业务目标分支）

> 基座保持中性，下列方向独立 git 分支或 fork 即可派生。

### 路线 1：HireFlow 候选人评估前端（G1）
- 复用：`RadarChart5D` / `WizardPage` / `pdfReport` / `CompanyHiringPanel`
- 改造：把 `Student` 类型扩展为 `Candidate`；`pathAnalysis` 改为 `competencyAnalysis`；Supabase 表换成 HireFlow 候选人库

### 路线 2：教学网站 AI 学情助手（assistant-teaching-website）
- 复用：`AIAdvisorWidget` / `DifyConfigCard` / `data/courses.ts` / `HomePage` 时间轴
- 改造：接入现有教学网站后端 API 替换 Supabase；把"职业路径"换成"课程学情"

### 路线 3：校园 Agent 学生端（campus-agent / xmxc）
- 复用：整套 4-Tab 框架 + `AppContext` + Supabase schema
- 改造：替换 logo / 文案；新增校园场景 Tab（如"今日任务"）

### 路线 4：Lai-Lu 垂直交付（G6）
- 复用：UI 基座 + `ShareCardModal` + Confetti
- 改造：按 Lai-Lu 业务领域重写 `pages/`，但保留 `components/ui` 整层

### 路线 5：通用「评估 → 路径 → 报告」SaaS
- 复用：所有 4 层
- 改造：把 `data/` 抽象成可注入的"领域包"，运行时切换（教育/招聘/培训/咨询）

---

## 六、安全与合规

- ⚠️ `.env` 已 `.gitignore`，**不要提交**
- ⚠️ `service_role` 密钥**永远只能在服务端（Supabase Edge Functions / Node 后端）使用**
- ⚠️ 生产部署前请：
  - 替换 `VITE_SUPABASE_URL` 为自有项目
  - Dify 自托管或换成自己的 API Key
  - 审计 `index.html` 中 `og:image` 的 CDN 链接是否仍需保留

---

## 七、未实施 / 已知差距

参照源 PRD（`docs/prd.md`，编码混乱已知）：
- 用户注册/登录（基座未带）
- 学习进度服务端持久化
- 移动端 PWA
- 多语言（i18n）
- 社交功能（评论 / 求职帖）

按派生路线图选择性补齐。
