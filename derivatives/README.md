# 派生（Derivatives）路线

> 本目录存放 **派生产品的改造规范（SPEC）**。每个派生产品并不重新拷贝整个 base 仓库，而是通过：
>
> 1. **`src/config/brands/<id>.ts`** —— 品牌/文案/主题/功能开关
> 2. **`VITE_BRAND=<id>`** —— 构建时切换
> 3. **派生 SPEC**（本目录下） —— 描述需要额外覆盖的页面 / 服务 / 数据模型
>
> 实现"单仓库多产品"，最大化复用。

## 派生矩阵

| 派生 ID | 业务领域 | 对应 G | 状态 | SPEC |
|---|---|---|---|---|
| `default` | 高校职业测评（秒哒原版） | — | 已就绪 | base 自带 |
| `hireflow` | HR 候选人评估 | G1 | **生产就绪**（AuthGate + 5 步 Wizard + 双塔推荐 + Supabase 真写入 + PDF 报告 + observability 埋点） | [hireflow/SPEC.md](./hireflow/SPEC.md) |
| `teaching` | AI 学情助手 | — | **多页可用**（LearningHome → CoursePage / KnowledgeGapPage） | [teaching-assistant/SPEC.md](./teaching-assistant/SPEC.md) |
| `campus` | 校园 Agent 学生端 | — | **多页可用**（CampusHome + RAG 问答 + SchedulePage + ServicesPage） | [campus-agent/SPEC.md](./campus-agent/SPEC.md) |
| `lai-lu` | Lai-Lu 垂直交付 | G6 | **占位骨架可演示**（LaiLuHome），待业务对齐 | [lai-lu/SPEC.md](./lai-lu/SPEC.md) |

## 派生流程

1. **Copy & Override**
   ```bash
   cp src/config/brands/default.ts src/config/brands/<new-id>.ts
   # 编辑品牌字段
   ```
2. **注册到切换器**：在 `src/config/brand.ts` 的 `registry` 增加条目
3. **覆盖类型**：如需扩展业务字段，在 `src/types/types.ts` 加 `<NewId>Student` 等子类型
4. **覆盖服务**：在 `src/services/` 增加派生服务（如 `competencyAnalysis.ts`）
5. **覆盖页面**：必要时在 `src/pages/` 下增加 `<NewId>HomePage.tsx`，在 `App.tsx` 按 brand 路由
6. **构建**：`VITE_BRAND=<new-id> npm run build`

## 与现有 workspace 的对接

`E:\我的世界java测试版\` 已有的相关项目：

| Workspace 项目 | 关系 | 建议 |
|---|---|---|
| `assistant-teaching-website/` | 教学网站后端 | derivatives/teaching-assistant 前端的 API 提供方 |
| `ai-assistant-teaching-website/` | 教学网站 AI 模块 | 复用 LLM 端点到 difyApi.ts |
| `campus-agent/` | 校园 Agent 后端 | derivatives/campus-agent 前端的 API 提供方 |
| `xmxc-knowledge-base/` | 校园知识库 | 注入到 campus brand 的资源中心 |
| `lai-lu/` | Lai-Lu 业务 | 后续派生 lai-lu brand |
| `HireFlow_*.md` | HireFlow 架构文档 | 指导 derivatives/hireflow 落地 |
| `dual_tower/` | 双塔系统 | 候选人/岗位匹配可调入 hireflow |

参见根目录 [STRATEGY.md](../STRATEGY.md) 了解 G1-G7 战略映射。
