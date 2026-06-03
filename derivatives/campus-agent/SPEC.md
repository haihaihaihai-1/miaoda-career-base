# Derivative · 校园智能助手（Campus Agent）

> 对接 workspace 中 `campus-agent/` 与 `xmxc-knowledge-base/`。

## 1. 业务目标

打造**一站式校园 App**：通知 / 选课 / 答疑 / 生活服务 / AI 对话，
后端复用 workspace 已有 `campus-agent/` 服务，知识库复用 `xmxc-knowledge-base/`。

## 2. 复用 / 改造

### ✅ 复用
- 整套 4-Tab 框架（首页 / 问答 / 服务 / 我的）
- `AIAdvisorWidget` → 校园 AI 助手（默认全屏对话，不再悬浮）
- `AppContext` 状态管理
- `ShareCardModal` → 分享校园活动 / 通知
- 所有 shadcn/ui 组件

### 🔧 改造
| 原始 | 派生 | 备注 |
|---|---|---|
| `HomePage` 学习路径 | `CampusHomePage` 今日校园 | 通知 + 课表 + 一卡通余额 + 推荐 |
| `WizardPage` 6 步问卷 | `OnboardingPage` 3 步引导 | 专业 / 年级 / 兴趣 |
| `DiscoverPage` 资源 | `ServiceCenterPage` | 接 xmxc 知识库 + 校园办事流程 |
| `ProfilePage` | `StudentProfilePage` | 学号、宿舍、班级 |
| `data/jobRoles.ts` | 弃用 |
| `data/courses.ts` | 接学校教务系统课程表 |

### 🆕 新增
- `src/pages/campus/AnswerPage.tsx` —— 校园问答主界面（RAG 检索 xmxc 知识库）
- `src/pages/campus/SchedulePage.tsx` —— 课表 + 考试日历
- `src/services/campusAPI.ts` —— 调用 `campus-agent/` 后端

## 3. 后端契约

`campus-agent/` 预期暴露：
- `GET /api/student/me` —— 当前学生信息（基于 SSO）
- `GET /api/notices?campus=xxx` —— 通知
- `GET /api/schedule?date=xxx` —— 课表
- `POST /api/qa` —— RAG 问答（流式，body 包含 question + history）
- `GET /api/services` —— 办事服务清单

知识库（`xmxc-knowledge-base/`）通过 RAG pipeline 被 `/api/qa` 调用。

## 4. 启动

```bash
VITE_BRAND=campus
VITE_CAMPUS_API_BASE=https://campus.example.edu.cn/api
VITE_DIFY_API_URL=        # 可选，若使用 Dify 而非自建 RAG
npm run dev
```

## 5. 实施 Checklist

- [ ] 1. `campus-agent/` 后端补齐上述 5 个端点
- [ ] 2. `xmxc-knowledge-base/` 完成索引化（chunks + embeddings）
- [x] 3. `src/services/campusAPI.ts` 完成 + 类型（学生 / 通知 / 课表 / 服务）
- [x] 3b. `src/services/campusRAG.ts` 完成（SSE 流式 RAG 问答）
- [ ] 4. SSO 单点登录前端集成（OAuth2 / CAS）—— 占位 localStorage token
- [x] 5. `src/pages/campus/CampusHome.tsx`（首页：学生卡 + 今日课表 + 通知 + 服务网格 → 二级页跳转）
- [x] 5b. `src/pages/campus/CampusQAPanel.tsx`（悬浮 RAG 问答面板）
- [x] 5c. `src/pages/campus/SchedulePage.tsx`（周课表，5 天网格视图）
- [x] 5d. `src/pages/campus/ServicesPage.tsx`（12 项服务 + 搜索 + 4 分类过滤）
- [x] 5e. 路由容器 `pages/campus/Index.tsx`（home ↔ schedule ↔ services）
- [x] 5f. App.tsx 加 campus brand 路由
- [x] 6. 移动端优化（viewport-fit=cover + safe-area-inset + 渐变 Hero）
- [x] 7. PWA 基础（manifest.webmanifest + icons + apple-touch-icon + theme-color + Service Worker）
- [x] 8. CI 包含 `campus` brand 构建
