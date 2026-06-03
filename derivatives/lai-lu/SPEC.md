# Derivative · Lai-Lu 垂直产品交付

> 对应 CLAUDE.md **G6 · 垂直产品交付（Lai-Lu）**。
> 当前为骨架占位，待业务负责人对齐后细化。

## 1. 业务目标

（待补充。请由 Lai-Lu 业务负责人提供：目标用户、核心使用场景、北极星指标）

## 2. 复用 / 改造矩阵（占位草案）

### ✅ 默认复用
- `src/components/ui/*`
- `src/components/ai/AIAdvisorWidget.tsx`
- `src/components/profile/DifyConfigCard.tsx`
- `src/components/home/ShareCardModal.tsx`
- `src/services/difyApi.ts`

### 🔧 待业务确认是否启用
- `RadarChart5D`（若有多维评估场景）
- `pdfReport`（若需导出）
- `WizardPage`（若有结构化引导）
- `CompanyHiringPanel`（若涉及匹配）

## 3. 改造步骤

```bash
# 1. 修改品牌
edit src/config/brands/lai-lu.ts

# 2. 业务页面（按需）
mkdir src/pages/lai-lu
touch src/pages/lai-lu/Home.tsx

# 3. 在 App.tsx brand 路由分支加入 lai-lu

# 4. 构建
$env:VITE_BRAND="lai-lu"; npm run build
```

## 4. 与 workspace lai-lu/ 后端对接

待 `E:\我的世界java测试版\lai-lu\` 后端 API 设计完成后，补充：
- `src/services/laiLuAPI.ts` — REST 客户端
- `src/types/lai-lu.ts` — 类型定义

## 5. Checklist（与业务对齐后填）

- [x] 品牌 brand 配置（`brands/lai-lu.ts`）
- [x] LaiLuHome 占位首页（Hero + 3 特性卡片 + UserMenu / Theme / Language）
- [x] LaiLuIndex 容器 + App.tsx brand 路由分发
- [x] CI matrix 包含 `lai-lu` brand 构建
- [ ] 北极星指标确认（业务方）
- [ ] 用户画像与核心场景（业务方）
- [ ] 后端 API 契约（业务方）
- [ ] 数据模型（如需 Supabase migration）
- [ ] UI 文案与品牌色（已占位 330° 紫红，可换）
- [ ] 上线方式（独立域名 / iframe 嵌入 / 小程序）
