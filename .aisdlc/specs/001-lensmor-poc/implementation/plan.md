---
title: I1 Implementation Plan（Lensmor POC）
status: draft
---

# Lensmor Monitor POC 实现计划（SSOT）

> **必需技能：** `spec-execute`（按批次执行本计划）
> **上下文获取：** 必须先执行 `spec-context` 获取上下文，定位 `{FEATURE_DIR}`，失败即停止

**目标：** 在 Next.js 框架下，端到端跑通“竞品情报抓取 -> AI 分析 -> Diff可视化前端展示”的 POC。
**范围：** In: 前端 UI (骨架/Diff)、API Route 后端调度、Jina 抓取、Mock Reddit 数据。Out: 生产级 MQ、多用户鉴权、数据库落盘长久保存。
**架构：** 基于 Next.js Server Actions / API Routes 构建轮询伪异步流水线。前端通过定时 `fetch` 查询内存/简单全局变量状态，不阻塞 UI 渲染。
**验收口径：** 参考 `solution.md` Mini-PRD。用户提交 URL 后，展示 Loading 态，完成后展示含 Diff 与 Actionable Advice 的卡片。
**子仓范围：** 无

---

## TL;DR（3–7 行）

- 一句话目标：实现极简架构的 Lensmor POC。
- In/Out：包含核心主链路展示；不含真正的异步容灾部署。
- 关键路径：1) 搭建基础前端界面与 Mock 分析卡片，确立 UI 基调。 2) 搭建 API 伪异步任务状态机。 3) 接入 Jina 真实抓取与真实 LLM Prompting。
- 最大风险与优先验证点：前端 Tailwind/Framer-motion 动效能否快速堆叠出高级感（对应 R1 验证）。

---

## 范围与边界（In / Out）

- **In**：`app/page.tsx`, `app/api/analyze/route.ts` 等单项目架构代码。
- **Out**：任何复杂的 Supabase RLS、Auth、Edge Functions。
- **不变量/关键约束**：接口必须做到秒级响应（返回 `pending`），真正的耗时任务挂在后台跑。
- **影响面**：新增代码，无破坏性影响。

## 代码工作区清单

| 子仓路径 | 是否受影响 | 是否 required | 期望分支 | 例外原因 |
|---|---|---|---|---|
| 无 | 否 | false | `001-lensmor-poc` | 无 |

---

## 里程碑与节奏

- **M0（前端展示 MVP）**：只用 Mock 数据跑通 `page.tsx`，把输入框、加载动效、报告卡片（含 Diff 差异对比）展现出来。
- **M1（伪异步接口打通）**：建立 `api/analyze` 路由与轮询逻辑。
- **M2（全链路贯通）**：后台集成 Jina Reader 请求并构造 Prompt 喂给 LLM，返回真实的分析数据。

---

## 依赖与资源

- 环境/权限：Vercel 本地开发环境 (`npm run dev`)。
- 外部系统：Jina Reader (免 Key，已测通)，LLM (OpenAI/Anthropic 需要本地环境变量配置)。
- 数据/样本：需要一份写死在本地的 `mock_data.ts` 用于快速测试。

---

## 风险与验证（可执行）

| # | 风险/假设 | 验证方式 | 成功信号 | 失败信号 | Owner | 截止 | 下一步动作 |
|---|---|---|---|---|---|---|---|
| R1 | 前端 Diff UI 难写 | 直接在 M0 任务中手搓左右结构组件 | Tailwind 几十分钟搞定 | 样式混乱 | DEV | M0 期间 | 降级成纯文本 |
| R2 | Server API Route 会被浏览器中止连接 | 前端发起 fetch 后忽略它，只关注 /status | 浏览器中止原连接，但后台继续执行完毕 | 后台也被 NodeJS 杀死 | DEV | M1 期间 | 如果被杀，所有耗时只能改回强阻塞同步或换框架。 |

---

## 验收口径（可追溯）

- 追溯：`requirements/solution.md` Mini-PRD。
- 关键验收点：
  1. 用户可以输入 URL。
  2. 提交后无刷新并出现进度骨架屏。
  3. 卡片包含 Before/After 差异，以及行动建议。

---

## NEEDS CLARIFICATION

无。（所有约束已在 R1 与 D2 扫清）

---

## 任务清单（SSOT）

### Task T1: M0 - 构建前端输入框与 Mock 报表页面

- [x] **状态**：完成

**代码仓范围：**
- 根项目：OneKunDay

**文件：**
- 创建：`src/app/mock_data.ts`, `src/components/ReportCard.tsx`
- 修改：`src/app/page.tsx`

**验收点：**
- 页面有输入框和一个“开始监控”按钮。
- 点击后，假装加载 3 秒，然后展示包含 Mock Diff 数据和 Mock 行动建议的精美卡片。
- (补充) 整体页面布局调整为带侧边栏的 Dashboard 结构。

**步骤 1：写最少实现**
- 修改点：实现 `ReportCard.tsx`（左右分栏的差异对比 UI），更新 `page.tsx` 使用本地 state 控制展现流程。

**步骤 2：运行验证**
- Run: 浏览器打开 `http://localhost:3001`
- Expected: 正常渲染 Tailwind 样式，点击按钮有良好反馈。
- Result: PASS. UI 渲染美观，动画流畅，且已外挂 Dashboard 侧边栏，符合产品预期。

**步骤 3：提交**
- Commit message: `[feat] M0: 实现基于 Mock 数据的报表展现层与主页输入逻辑` (及后续 Dashboard Layout commit)
- 审计信息：
  - repo: `root`
    branch: `001-lensmor-poc`
    commit: `f7b2498, 94811cc`
    pr: `N/A`
    changed_files: 
      - `src/app/mock_data.ts`
      - `src/components/ReportCard.tsx`
      - `src/app/page.tsx`

### Task T2: M1 - 构建极简伪异步 API Route

- [x] **状态**：完成

**代码仓范围：**
- 根项目：OneKunDay

**文件：**
- 创建：`src/app/api/analyze/route.ts`

**验收点：**
- 提供 `POST` 方法：接收 URL，返回 `taskId`。
- 提供 `GET` 方法：依据 `taskId` 返回 `pending` 或 `completed`。

**步骤 1：写最少实现**
- 修改点：在 Node.js 环境声明一个全局 `Map` (或 `global.taskStore`)，POST 时写入 `pending` 并异步跑一个 setTimeout，改写为 `completed`；GET 时去 Map 里查询。

**步骤 2：运行验证**
- Run: `curl -X POST http://localhost:3001/api/analyze` 然后连续 `curl GET`。
- Expected: 刚开始返回 pending，几秒后返回 completed。
- Result: PASS. `curl` 验证通过，成功实现状态机的伪异步。

**步骤 3：提交**
- Commit message: `[feat] M1: 建立 Next.js 内存级的伪异步任务调度接口`
- 审计信息：
  - repo: `root`
    branch: `001-lensmor-poc`
    commit: `3383c63`
    pr: `N/A`
    changed_files: 
      - `src/app/api/analyze/route.ts`

### Task T3: M1.5 - 前后端联调替换 Mock

- [ ] **状态**：未开始

**代码仓范围：**
- 根项目：OneKunDay

**文件：**
- 修改：`src/app/page.tsx`

**验收点：**
- 页面不再使用本地的 setTimeout，而是通过 `fetch` 调用 POST，然后在 `useEffect` 中轮询 GET 接口，待 completed 后展示刚才写的 Mock 数据。

**步骤 1：写最少实现**
- 修改点：`page.tsx` 中编写 `pollTask` 逻辑，每 2 秒一次。

**步骤 2：运行验证**
- Run: 点击页面按钮。
- Expected: Network 面板看到 `/api/analyze` 轮询，页面 Loading 不卡顿。

**步骤 3：提交**
- Commit message: `[feat] M1.5: 前端改为轮询真实接口展示 Mock 数据`
- 审计信息：
  - repo: `root`
    branch: `001-lensmor-poc`
    commit: `<TBD>`
    pr: `<TBD>`
    changed_files: `<TBD>`

---

## Merge-back 待办清单

无
