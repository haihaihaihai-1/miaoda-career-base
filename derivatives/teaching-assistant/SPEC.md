# Derivative · AI 学情助手（Teaching Assistant）

> 对接 workspace 中 `assistant-teaching-website/` 与 `ai-assistant-teaching-website/`。

## 1. 业务目标

为现有教学网站补一个面向**学生的智能学情助手**：
- 看清自己的课程进度与知识点掌握
- 即时答疑（接入既有 LLM 端点）
- 收到个性化学习路径建议

## 2. 复用 / 改造矩阵

### ✅ 复用
- `WizardPage` → 课程报名 / 学情自评
- `HomePage` 时间轴 → 课程学习里程碑
- `RadarChart5D` → 知识点掌握度雷达
- `AIAdvisorWidget` → 改成"AI 助教"接入教学网站 LLM
- `DifyConfigCard` → 老师/管理员配置 AI 模型
- `pdfReport` → 学情周报导出
- `data/courses.ts` → 注入教学网站真实课程目录

### 🔧 改造
| 原始 | 派生 | 备注 |
|---|---|---|
| `pathAnalysis.ts` | `learningPathAnalysis.ts` | 基于已修课程 + 成绩，生成下一阶段建议 |
| `types.ts::Student` | 扩展 `enrolledCourses`/`grades`/`weakKnowledgePoints` |
| `services/difyApi.ts` | 增加 `services/teachingLLM.ts` —— 调 workspace `LLM.py` 端点 |
| `db/supabase.ts` | 切换为教学网站自有 backend（REST / Affiliate AvatarServer） |

### ❌ 弃用
- `CompanyHiringPanel` / `jobRoles.ts` —— 教学场景不展示岗位

## 3. 与 workspace 资产对接

```
assistant-teaching-website/
  └── affiliate-project/
       └── AvatarServer/
            └── AvatarServer/
                 └── LLM.py        ← teachingLLM.ts 调用
```

- 端点：通过 nginx 反代到 `/api/llm/chat`（流式 SSE，复用 difyApi.ts 的 EventSource 解析逻辑）
- 鉴权：Bearer Token（学校 SSO 单点登录后下发）
- 知识库：注入 workspace `xmxc-knowledge-base/` 作为 RAG 检索源

## 4. 数据模型

教学网站已有自己的学生/课程/成绩表，**派生端不复制**，只通过 REST API 读取：

```typescript
// src/services/teachingAPI.ts
const API_BASE = import.meta.env.VITE_TEACHING_API_BASE ?? "/api";

export async function fetchMyEnrollments(): Promise<Enrollment[]> { ... }
export async function fetchMyProgress(courseId: string): Promise<Progress> { ... }
export async function fetchKnowledgeGaps(): Promise<KnowledgePoint[]> { ... }
```

## 5. 启动

```bash
# .env 配置
VITE_BRAND=teaching
VITE_TEACHING_API_BASE=https://teaching.example.com/api
VITE_DIFY_API_URL=          # 不用 Dify 时留空
# 复用 teachingLLM 直连 LLM.py
VITE_LLM_PROXY_URL=/api/llm/chat
```

## 6. 实施 Checklist

- [x] 1. 完成 `src/services/teachingAPI.ts` + 类型
- [x] 2. 完成 `src/services/teachingLLM.ts`（SSE）
- [x] 3. 实现 `src/pages/teaching/LearningHome.tsx`（进度卡 + 弱项 + AI 助教流式对话）
- [x] 4. App.tsx brand 分发 → `VITE_BRAND=teaching` 直接出页面
- [x] 5. 实现 `src/pages/teaching/CoursePage.tsx`（课程详情：进度 + 知识点分类）
- [x] 6. 实现 `src/pages/teaching/KnowledgeGapPage.tsx`（弱项总览 + 严重度分级）
- [x] 7. 路由容器 `pages/teaching/Index.tsx`（home ↔ course ↔ gaps 切换）
- [ ] 8. 改造 `AIAdvisorWidget` 支持 provider 切换（Dify | TeachingLLM）
- [ ] 9. 嵌入教学网站：可作为 iframe 子应用，也可独立部署后通过 nginx location 挂载
- [x] 10. CI matrix 包含 `teaching` brand 构建
