# Derivative · HireFlow 候选人评估

> 对应 CLAUDE.md **G1（自主编程平台 / 候选人评估）** 与 workspace 中 `HireFlow_*.md` 系列架构文档。

## 1. 业务目标

把 miaoda 原版的"学生 → 学习路径"流程改造为：
**候选人 → 多维能力评估 → 雷达图能力图谱 → PDF 可分享报告 → 招聘决策辅助**

## 2. 复用 / 新增 / 弃用 三栏

### ✅ 直接复用（零修改）
- `src/components/ui/*` —— shadcn/ui 全套
- `src/components/charts/RadarChart5D.tsx` —— 5D 能力雷达
- `src/components/home/ShareCardModal.tsx` —— 评估卡片分享
- `src/services/pdfReport.ts` —— PDF 报告导出
- `src/services/difyApi.ts` —— Dify SSE 对话（用于 AI 面试 Agent）
- `src/components/ai/AIAdvisorWidget.tsx` —— 改造为"AI 面试官悬浮窗"
- `src/hooks/*`、`src/lib/utils.ts`

### 🔧 改造（保留结构，换语义）
| 原始 | 派生 | 备注 |
|---|---|---|
| `src/types/types.ts::Student` | `Candidate` | 增加 `targetPosition` / `experienceYears` / `interviewStage` |
| `src/utils/pathAnalysis.ts` | `competencyAnalysis.ts` | 把"学习路径"算法换为"胜任力差距"算法 |
| `src/pages/WizardPage.tsx` | `AssessmentWizardPage.tsx` | 6 步问卷 → 5 步评估（基本信息/经历/技能自评/案例题/AI 对话） |
| `src/pages/HomePage.tsx` | `AssessmentHomePage.tsx` | 时间轴改为"评估阶段" |
| `src/pages/ProfilePage.tsx` | `RecruiterProfilePage.tsx` | 切换为 HR 视角，看候选人池 |
| `src/components/CompanyHiringPanel.tsx` | `JobMatchPanel.tsx` | 双塔模型（dual_tower）调用，候选人 ↔ 岗位匹配度 |
| `src/data/jobRoles.ts` | 接 dual_tower job_position 表 | 不再 mock |
| `src/data/skillLevels.ts` | `competencyDimensions.ts` | 替换为胜任力 5 维（专业/学习/沟通/抗压/领导） |

### ❌ 弃用（hireflow 用不到）
- `src/components/home/CertBanner.tsx` —— 1+X 证书提醒（招聘场景不需要）
- `src/data/reports/*.ts` —— 学生导向行业报告

## 3. 数据模型扩展（Supabase）

新建表（不破坏原 students 表）：

```sql
-- 候选人主表
create table candidates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text,
    phone text,
    target_position text,
    experience_years int,
    interview_stage text check (interview_stage in ('initial','technical','final','offer','rejected')),
    competency_scores jsonb,              -- {专业:80, 学习:70, 沟通:65, 抗压:75, 领导:60}
    overall_match_rate numeric,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 评估记录
create table assessments (
    id uuid primary key default gen_random_uuid(),
    candidate_id uuid references candidates(id) on delete cascade,
    assessor_id uuid,
    job_position_id uuid,                  -- 关联 dual_tower 岗位表
    stage text,
    structured_answers jsonb,              -- 问卷答案
    ai_dialogue_summary text,              -- Dify 对话摘要
    pdf_report_url text,
    created_at timestamptz default now()
);

create index idx_candidates_target on candidates(target_position);
create index idx_assessments_candidate on assessments(candidate_id);
```

## 4. 与 workspace 资产对接

| workspace 路径 | 对接方式 |
|---|---|
| `dual_tower/` | candidate ↔ position 匹配度由 dual_tower 双塔模型推理产出 |
| `HireFlow_双模型主驱动架构.md` | 主模型（评估生成）+ 副模型（事实核查）调用规范 |
| `HireFlow_候选人雷达.md` | 雷达 5 维度定义对齐到 `competencyDimensions.ts` |
| `agent-research/` | AI 面试官 Agent 的 prompt + 行为脚本 |

## 5. 启动方式

```bash
# 仍在 miaoda-career-base 仓库内
cp .env.example .env
# 在 .env 设置：
#   VITE_BRAND=hireflow
#   VITE_SUPABASE_URL=...
#   VITE_DIFY_API_URL=...
npm run dev
```

## 6. 实施 Checklist（TDD 顺序）

- [x] 1. 写 `tests/competencyAnalysis.test.ts` — 评估算法的单测（21 个用例）
- [x] 2. 创建 `src/types/hireflow.ts` —— `Candidate` / `Assessment` / `Competency*` 类型
- [x] 3. 实现 `src/services/competencyAnalysis.ts` —— 通过所有测试
- [x] 4. 建表 `supabase/migrations/0001_hireflow.sql`（含 RLS、view、trigger）
- [x] 5. 实现 `src/pages/hireflow/AssessmentWizard.tsx`（5 步评估，**已迁移到 WizardShell**）
- [x] 6. 实现 `src/pages/hireflow/AssessmentHome.tsx`（候选人列表 + 雷达 + Gap）
- [x] 7. App.tsx 加入 brand 分支路由
- [x] 8. CI 加 `hireflow` brand 构建（已配置）
- [x] 9. 双塔推荐岗位 SDK（`src/services/dualTower.ts` + 19 单测，HomePage 集成 top-3 卡片）
- [x] 10. Supabase 持久化层（`src/services/hireflowDB.ts` + Home 用 React Query + DB/Mock badge）
- [x] 11. AI 案例题评分（`src/services/aiScoring.ts` + Wizard 接入，Dify 优先 + 启发式 fallback）
- [x] 12. AuthGate 包装 hireflow Index（required=true，HR 评估涉及 PII 必须登录）
- [x] 13. Wizard 草稿持久化（draftKey="hireflow-assessment-v1" + Demo 一键填充）
- [x] 14. Observability 埋点（wizard.start / wizard.submit / candidate.created）
- [x] 15. Wizard 提交后真写 Supabase：`AssessmentWizard.onComplete` 签名升级为 `WizardCompletion = { candidate, assessment }`；`hireflow Index.handleComplete` 已用 `persistCandidateWithAssessment` 一次性写 candidate + assessment（带回退到本地内存）
- [x] 16. PDF 报告水印 + 访问令牌：`lib/hireflowPdfReport.ts` 封面 + 5 维 + Gap + 案例附录 + 全页水印 + token 追溯（4 单测）
- [x] 17. ChatProvider 抽象：`services/aiProvider.ts`（mock / dify / teaching / campus + 工厂 + 运行时切换 + 持久化偏好 + 12 单测），UI 由 `components/ai/BrandAdvisor.tsx` 调度（hireflow 走 Dify provider）
- [x] 18. Sentry 真接入：`lib/sentryAdapter.ts` 自动检测 `VITE_SENTRY_DSN` + 动态 import `@sentry/react`，`main.tsx` 调 `wireSentry()`；`vite.config.ts` 已将 `@sentry/react` 标 external
- [x] 19. ChatProvider 切换面板：UserMenu 下拉新增 "AI Provider" 入口（运行时切换 brand 后端）
- [x] 20. 移动端响应式：hireflow Home header 增加 `flex-wrap` + 窄屏 CTA 缩写（"新建" / "新建候选人评估"）
- [ ] 21. **下一阶段**：训练 hireflow 专属双塔（workspace dual_tower 为蛋白领域，仅作架构参考）
- [ ] 22. **下一阶段**：Playwright E2E（5 brand smoke test）

## 7. 风险与边界

- ⚠️ **数据隐私**：候选人信息涉及 PII，Supabase RLS 必须严格配置（按 `assessor_id` 隔离行）
- ⚠️ **AI 偏见**：competency 评分若来自 LLM，需要 bias 审计（参见 `security-auditor` skill）
- ⚠️ **PDF 导出泄露**：分享卡 + PDF 必须做水印 / 访问令牌（修改 `pdfReport.ts`）
