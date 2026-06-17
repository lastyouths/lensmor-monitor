---
title: I1 Implementation Plan（Lensmor POC）
status: implemented
---

# Lensmor Monitor POC 实现计划（SSOT）

> **必需技能：** `spec-execute`（按批次执行本计划）
> **上下文获取：** 必须先执行 `spec-context` 获取上下文，定位 `{FEATURE_DIR}`，失败即停止

**目标：** 在 Next.js 框架下，端到端跑通"竞品情报抓取 -> AI 分析 -> Diff可视化前端展示 -> 多租户鉴权 -> AI 深度追问"的 POC。
**范围（最终落地）：** In: 前端 UI (骨架/Diff/时间轴/任务控制)、API Routes 后端调度、Jina 抓取、Supabase Auth + Postgres、报告分享、AI 悬浮 Chat、反馈持久化。Out: 生产级 MQ、Cron 调度、邮件告警。
**架构：** 基于 Next.js Server Actions / API Routes 构建轮询伪异步流水线。Supabase SSR Auth 提供多租户隔离。AI SDK v6 提供流式 Chat。
**验收口径：** 参考 `solution.md` Mini-PRD 全部 8 条 AC。
**子仓范围：** 无

---

## TL;DR（3–7 行）

- 一句话目标：实现含 Auth + 数据持久化 + AI 追问的 Lensmor POC。
- In/Out：包含核心主链路展示及多租户数据安全；不含真异步容灾部署与自动化调度。
- 关键路径：M0 UI → M1 伪异步 API → M2 Jina + LLM → M3 Auth → M4 数据落盘 → M5 全局看板 → M6 任务控制+真实 Diff → M7 分享+Chat → M8 安全+反馈持久化。
- 最大风险（已解）：AI SDK v5→v6 破坏性 API 变更，已完整迁移。

---

## 范围与边界（In / Out）

- **In**：`app/page.tsx`、`app/api/analyze`、`app/api/targets`、`app/api/reports`、`app/api/feedback`、`app/api/chat`、`app/share/[id]`、`components/GlobalChat`、`components/ReportCard`、`components/CompanyTimelineView`。
- **Out**：Supabase RLS（用代码层 `user_id` 过滤替代）、Cron Job、MQ、邮件告警。
- **不变量/关键约束**：接口必须做到秒级响应（返回 `pending`）；PATCH 类写接口必须加 `user_id` 过滤防越权。
- **影响面**：新增代码，无破坏性影响。

## 代码工作区清单

| 子仓路径 | 是否受影响 | 是否 required | 期望分支 | 例外原因 |
|---|---|---|---|---|
| 无 | 否 | false | `001-lensmor-poc` | 无 |

---

## 里程碑与节奏

- **M0（前端展示 MVP）**：Mock 数据跑通 `page.tsx`，输入框、加载动效、报告卡片（含 Diff 差异对比）。
- **M1（伪异步接口打通）**：建立 `api/analyze` 路由与轮询逻辑。
- **M2（全链路贯通）**：后台集成 Jina Reader + LLM Structured Output。
- **M3（Auth 接入）**：Supabase SSR Auth，登录/注册，路由保护。
- **M4（数据落盘）**：reports + monitor_targets 表，历史持久化。
- **M5（全局看板）**：侧边栏任务列表，未读计数，历史时间轴。
- **M6（任务控制 + 真实 Diff）**：暂停/恢复/频次/手动触发，LLM 对比历史报告做真实差异检测。
- **M7（分享 + AI Chat）**：公开分享快照页，全局 AI 悬浮追问组件。
- **M8（安全 + 反馈持久化）**：修复全部缺陷，反馈 API + 数据库落盘。

---

## 依赖与资源

- 环境/权限：Vercel 本地开发环境 (`npm run dev`)。
- 外部系统：Jina Reader（免 Key）、LLM（OpenAI/兼容代理，需 `.env.local`）、Supabase（需 `.env.local`）。
- 数据/样本：`src/app/mock_data.ts`（LLM 不可用时降级）。
- 数据库迁移：`docs/migration_report_feedbacks.sql`（BUG-01 修复，需在 Supabase SQL Editor 手动执行）。

---

## 风险与验证（最终状态）

| # | 风险/假设 | 验证方式 | 成功信号 | 结果 |
|---|---|---|---|---|
| R1 | 前端 Diff UI 难写 | M0 手搓左右结构组件 | Tailwind 几十分钟搞定 | ✅ PASS |
| R2 | Server API Route 被浏览器中止 | 前端忽略原连接，只轮询 /status | 后台继续执行完毕 | ✅ PASS（内存 Map 方案稳定）|
| R3 | AI SDK v5→v6 API 破坏性变更 | 调试 useChat / streamText | 流式响应正常，Markdown 渲染正确 | ✅ PASS（完整迁移至 ai v6）|
| R4 | 越权写漏洞 | 测试报告审查 | PATCH 含 user_id 过滤 | ✅ PASS（BUG-02 已修复）|

---

## 验收口径（可追溯）

- 追溯：`requirements/solution.md` Mini-PRD 全部 8 条 AC。
- 测试报告：`el/submissions/test-report.md`（13 UC ✅ 10 / ⚠️ 2 → 全部修复后 ✅ 13 / 13）。

---

## NEEDS CLARIFICATION

无。（所有约束已在设计阶段扫清，所有缺陷已修复）

---

## 任务清单（SSOT）

### Task T1: M0 - 构建前端输入框与 Mock 报表页面

- [x] **状态**：完成

**文件：**
- 创建：`src/app/mock_data.ts`, `src/components/ReportCard.tsx`
- 修改：`src/app/page.tsx`

**结果：** PASS. UI 渲染美观，Dashboard 侧边栏布局，动画流畅。
提交：`f7b2498, 94811cc`

---

### Task T2: M1 - 构建极简伪异步 API Route

- [x] **状态**：完成

**文件：**
- 创建：`src/app/api/analyze/route.ts`

**结果：** PASS. `taskStore` 内存 Map 状态机 pending→completed 工作正常。
提交：`3383c63`

---

### Task T3: M1.5 - 前后端联调替换 Mock

- [x] **状态**：完成

**文件：**
- 修改：`src/app/page.tsx`

**结果：** PASS. 2s 轮询接口正常，不阻塞 UI。
提交：`c29cab8`

---

### Task T4: M2 - 全链路贯通（Jina 抓取 + LLM 分析）

- [x] **状态**：完成

**文件：**
- 修改：`src/app/api/analyze/route.ts`、`package.json`、`.env.example`

**结果：** PASS. Jina 抓取 + `generateObject`（Zod schema）结构化输出正常。
提交：`eaca803`

---

### Task T5: M3 - 接入 Supabase Auth

- [x] **状态**：完成

**文件：**
- 创建：`src/utils/supabase/server.ts`, `client.ts`, `middleware.ts`
- 创建：`src/app/login/page.tsx`, `src/app/login/actions.ts`
- 修改：`src/middleware.ts`

**结果：** PASS. 未登录访问 `/` 正确 307 跳转至 `/login`。
提交：`6f04d51`

---

### Task T6: M4 - 数据落盘长久保存（Supabase Postgres）

- [x] **状态**：完成

**关键点：**
- 创建 `reports` 表（含 `user_id`、`url`、`company_name`、`summary`、`differences`、`advices`、`company_profile`、`is_read`、`created_at`）。
- 创建 `monitor_targets` 表（含 `user_id`、`url`、`name`、`frequency`、`status`、`unread_count`）。
- `saveToDatabase` 函数在有 `userId` 时写库，无 `userId` 时静默跳过（POC 游客模式）。

---

### Task T7: M5 - 全局看板与侧边栏历史记录打通

- [x] **状态**：完成

**关键点：**
- 侧边栏展示真实监控任务列表与未读角标。
- 内容区展示选中任务的历史报告时间轴（降序，默认展开最新条目）。
- 全局概览看板：监控总数、活跃任务数、未读情报总计。

---

### Task T8: M6 - 任务控制中心 + 真实 Diff 比对

- [x] **状态**：完成

**文件：**
- 修改：`src/app/api/analyze/route.ts`（历史报告同步拉取，喂给 LLM 做真实差异检测）
- 修改：`src/app/api/targets/route.ts`（支持 PATCH frequency/status）
- 修改：`src/app/page.tsx`（任务控制面板 UI）

**关键点：**
- `POST /api/analyze` 在前台同步生命周期内拉取最近 1 条历史报告，避免后台无法读 Cookie 的问题。
- LLM Prompt 中注入历史摘要，实现真实 Diff 而非每次输出"无变化"。
- 任务面板支持：暂停/恢复（status 切换）、频次调整、手动触发分析、URL 编辑。

---

### Task T9: M7.1 - 情报报告公开分享

- [x] **状态**：完成

**文件：**
- 创建：`src/app/share/[id]/page.tsx`
- 创建：`src/app/share/not-found.tsx`

**关键点：**
- 使用 Supabase Anon Key 直接查询报告（RLS 已禁用，游客可读）。
- 无效 ID 调用 `notFound()` 返回标准 HTTP 404（WARN-01 修复）。
- 分享页不渲染 AI 悬浮球。

---

### Task T10: M7.2 - 全局 AI 悬浮追问（Chat with Intelligence）

- [x] **状态**：完成

**文件：**
- 创建：`src/components/GlobalChat.tsx`（GlobalChatProvider + GlobalChatWidget）
- 创建：`src/app/api/chat/route.ts`（AI SDK v6 流式 streamText）
- 修改：`src/app/layout.tsx`（包裹 GlobalChatProvider）
- 修改：`src/components/ReportCard.tsx`（"快速追问"入口按钮）
- 修改：`src/app/mock_data.ts`（ReportData 添加 `id?` 字段）
- 修改：`src/components/CompanyTimelineView.tsx`（传递 report.id）
- 修改：`src/app/share/[id]/page.tsx`（传递 report.id）

**关键点：**
- `useChat`（`@ai-sdk/react` v3）：`sendMessage` 发消息、`status` 判断加载态。
- `getMessageText` 辅助函数：从 `UIMessage.parts[]` 安全提取文本。
- `historyCache`（`useRef<Record<string, UIMessage[]>>`）：按 `report.id` 保存/恢复对话历史。
- API 路由：手动将 `UIMessage[]` 转换为 `CoreMessage[]`，使用 `toUIMessageStreamResponse()` 返回流。
- `ReactMarkdown` 渲染 AI 回复，带 Tailwind 自定义样式组件。
- `usePathname` 守卫：`/share` 路由不渲染悬浮球。

---

### Task T11: M8 - 安全加固 + 反馈持久化（BUG 修复批次）

- [x] **状态**：完成

**文件：**
- 修改：`src/app/api/reports/route.ts`（BUG-02：PATCH 加 user_id 过滤）
- 修改：`src/app/api/analyze/route.ts`（BUG-04：URL 协议/长度校验；BUG-05：非 JSON 请求体 400；BUG-03：未登录 requiresLogin 标记）
- 修改：`src/app/page.tsx`（BUG-03：requiresLogin Toast 提示）
- 创建：`src/app/api/feedback/route.ts`（BUG-01：POST/GET 反馈持久化）
- 修改：`src/components/ReportCard.tsx`（BUG-01：挂载恢复反馈状态 + handleFeedback 异步持久化）
- 修改：`src/app/share/[id]/page.tsx`（WARN-01：改用 notFound()）
- 创建：`src/app/share/not-found.tsx`（WARN-01：自定义 404 页）
- 创建：`docs/migration_report_feedbacks.sql`（BUG-01：report_feedbacks 表迁移脚本）

**缺陷修复清单：**

| 缺陷 | 严重度 | 状态 |
|------|--------|------|
| BUG-02 PATCH /api/reports 越权写 | 🔴 P0 | ✅ 已修复 |
| BUG-01 情报反馈无后端持久化 | 🟡 P1 | ✅ 已修复 |
| BUG-04 /api/analyze URL 服务端校验缺失 | 🟡 P1 | ✅ 已修复 |
| BUG-03 未登录分析完成 UX 误导 | 🟢 P2 | ✅ 已修复 |
| BUG-05 非 JSON 请求体返回 500 | 🟢 P2 | ✅ 已修复 |
| WARN-01 分享页 404 语义错误 | ⚪ P3 | ✅ 已修复 |

---

### Task T12: M9 - 真实原文提取与绝对差异比对引擎 (Raw Content Diff)
- [x] **状态**：完成

**文件：**
- 修改：`src/app/api/analyze/route.ts`
- 修改：`src/app/sandbox/page.tsx`
- 修改：`src/app/sandbox/SandboxEditor.tsx`
- 修改：`src/app/api/sandbox/route.ts`

**关键点：**
1. **废弃 Jina 与全面破除缓存**: 
   - 将抓取逻辑由 Jina 替换为原生的带 Browser UA 的 `fetch` 请求。
   - 在抓取 URL 后拼接毫秒级时间戳（`?_t=Date.now()`），彻底击穿 Vercel CDN 和 Next.js 的内置网络缓存。
   - `fetch` 响应后，执行强力的全标签剥离正则（`/<[^>]*>?/gm`）和无用节点（nav/style/script/svg）清洗，仅提取纯净文字与图片 Alt，彻底避免代码格式噪音干扰大模型。
2. **两阶段原生 Diff 策略**:
   - 首次采集：抓取源码存入 `raw_content` 建立基准，强制 `differences = []` 且不调起冗余对比。
   - 二次采集：直接以 `raw_content` 为唯一真理来源进行全文逐字对比（此前基于 Summary 降级的策略已弃用）。
3. **绕过 PostgREST Schema 失忆 BUG**:
   - `reports` 表因后期 `ALTER TABLE` 增加了 `raw_content` 列，导致 Supabase JS SDK 长时间缓存无法识别新列而静默置空。
   - 修复策略：先通过 `insert().select()` 安全插入核心字段获取记录 ID，随后立刻利用生成的 ID 触发一个底层 HTTP PATCH（`fetch`）请求单独回写 `raw_content` 字段，并指定 `SUPABASE_SERVICE_ROLE_KEY` 绕过列权限。
4. **废除前端导致 Serverless 冻结的死循环轮询**:
   - 彻底修复“卡在云端调度5分钟”致命 BUG。原因为 Vercel 只要响应结束就会冻结容器环境，导致后台挂起的 AI 任务无法被前端轮询到。
   - 解决：在 `page.tsx` 触发请求后强制 `await` 等待 API 路由内部调用 OpenAI 完成所有处理再响应。
5. **Sandbox 完全脱离缓存**:
   - `page.tsx` 添加 `dynamic = "force-dynamic"`, `revalidate = 0`, `fetchCache = "force-no-store"`。
   - API `DELETE` 和 `POST` 追加时间戳参数强制刷新 SSR 页面渲染。

---

## Merge-back 待办清单

无（POC 单分支开发，不涉及 merge-back）。

## 未来迭代方向（Backlog）

- Serverless Cron Job（自动定时采集）
- 邮件 / Webhook 告警
- 报告导出（PDF / Word）
- 竞品矩阵大盘
- 启用 Supabase RLS（从代码层迁移到行级安全策略）


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

- [x] **状态**：完成

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
- Result: PASS. Frontend now correctly hits POST /api/analyze and polls GET /api/analyze every 2 seconds.

**步骤 3：提交**
- Commit message: `[feat] M1.5: 前端改为轮询真实接口展示 Mock 数据`
- 审计信息：
  - repo: `root`
    branch: `001-lensmor-poc`
    commit: `c29cab8`
    pr: `N/A`
    changed_files: 
      - `src/app/page.tsx`

### Task T4: M2 - 全链路贯通 (Jina 抓取 + LLM 分析)

- [x] **状态**：完成

**代码仓范围：**
- 根项目：OneKunDay

**文件：**
- 修改：`src/app/api/analyze/route.ts`
- 修改/创建：根据需要创建单独的 LLM 调用服务文件或直接在 route.ts 中

**验收点：**
- 能够通过 `r.jina.ai` 获取指定 URL 的 Markdown 格式内容。
- 将获取到的 Markdown 内容提交给大模型 (OpenAI 或 Anthropic) 提取摘要、执行变更对比及生成行动建议。
- 大模型返回 JSON 数据，符合 `ReportData` 类型结构。
- 将生成的分析数据存入 `taskStore` 的 `completed` 状态中。

**步骤 1：写最少实现**
- 修改点：在 POST 处理逻辑中，增加 `fetch` 到 Jina 的逻辑，然后对接 `@ai-sdk/openai` 等 SDK 或者直接用原生的 fetch 调用 OpenAI 的 `/v1/chat/completions` 生成并强制返回结构化的 JSON 数据。

**步骤 2：运行验证**
- Run: 在前端页面输入一个真实的网址（如 `https://vercel.com`），点击开始监控。
- Expected: 几秒到几十秒后，页面刷新出针对该新网站的独家分析卡片。
- Result: PASS. Successfully integrated ai, @ai-sdk/openai, and zod. `api/analyze` now fetches from `r.jina.ai` and uses `generateObject` with `gpt-4o-mini` to extract structured analysis data.

**步骤 3：提交**
- Commit message: `[feat] M2: 接入 Jina 页面抓取与真实大语言模型智能分析`
- 审计信息：
  - repo: `root`
    branch: `001-lensmor-poc`
    commit: `eaca803`
    pr: `N/A`
    changed_files: 
      - `src/app/api/analyze/route.ts`
      - `package.json`
      - `.env.example`

### Task T5: M3 - 接入 Supabase Auth 与数据库体系

- [x] **状态**：完成

**代码仓范围：**
- 根项目：OneKunDay

**文件：**
- 创建：`src/utils/supabase/server.ts`, `src/utils/supabase/client.ts`, `src/utils/supabase/middleware.ts`
- 创建：`src/app/login/page.tsx`, `src/app/login/actions.ts`
- 修改：`src/middleware.ts` (路由保护), `package.json`

**验收点：**
- 安装 `@supabase/supabase-js` 与 `@supabase/ssr`。
- 构建基础的登录页面 (`/login`)，支持邮箱密码登录。
- 配置 Next.js Middleware，未登录用户访问 Dashboard 会被重定向到 `/login`。
- 修改环境变量预留 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。

**步骤 1：写最少实现**
- 修改点：按照 Supabase 官方 Next.js SSR 指南，编写 Auth 相关的 Client/Server 辅助函数，并搭建极简登录页与拦截器。

**步骤 2：运行验证**
- Run: 未登录状态下访问 `http://localhost:3000/`。
- Expected: 自动跳转到 `/login`。
- Result: PASS. Supabase SSR auth is integrated and the login page matches the visual design.

**步骤 3：提交**
- Commit message: `[feat] M3: 引入 Supabase SSR Auth 体系，实现正式的身份鉴权隔离`
- 审计信息：
  - repo: `root`
    branch: `001-lensmor-poc`
    commit: `6f04d51`
    pr: `N/A`
    changed_files: 
      - `src/utils/supabase/*`
      - `src/app/login/*`
      - `src/middleware.ts`

### Task T6: M4 - 数据落盘长久保存 (Supabase Postgres)

- [x] **状态**：完成

**代码仓范围：**
- 根项目：OneKunDay

**验收点：**
- 在 Supabase 中创建存储每次分析报告的表。
- 修改 `/api/analyze` 路由，在获取到大模型结果后，将结果落盘保存到 Supabase 数据库。

### Task T7: M5 - 全局看板与侧边栏历史记录打通

- [x] **状态**：完成

**代码仓范围：**
- 根项目：OneKunDay

**验收点：**
- 前端能通过接口获取历史检测记录，并在侧边栏展示真实的“监控中”列表。
- （可选）提供全局看板页，展示所有历史记录的概览。

---

## Merge-back 待办清单

无
