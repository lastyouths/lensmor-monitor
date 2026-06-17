---
title: D2 Design（Lensmor Monitor POC）
status: implemented
---

## 0. 基本信息

- 需求标识（分支 / ID）：001-lensmor-poc
- 标题（需求名 / RFC 名）：Lensmor Monitor POC - 多租户监控+AI情报+深度追问架构设计
- 作者：AI
- 评审人：Product
- 状态：implemented
- 最后更新：2026-06-17

## 1. 结论摘要（3–7 行）

- **一句话目标**：用最低架构成本（Next.js API Route 通吃）快速验证竞品监控核心闭环（采集 -> 分析 -> 差异比对 -> 建议 -> AI 深度追问）。
- **In / Out 边界（最终实际落地范围）**：
  - **In**：输入URL、Jina真数据抓取、差异展示卡片、前端伪异步排队体验、Supabase Auth 多租户鉴权、数据库持久化、任务中心（暂停/恢复/频次）、历史时间轴、未读计数、报告分享（公开只读）、情报反馈持久化、全局 AI 悬浮追问（per-report 上下文注入 + 历史缓存）。
  - **Out**：真正的分布式 MQ、Cron Job 自动定时触发、邮件/Webhook 告警、报告导出（PDF/Word）、竞品矩阵大盘。
- **推荐方案**：以 Next.js Server Actions / Route Handlers 承载后端任务，基于状态轮询营造异步体感，Supabase Postgres 持久化多租户数据，结合 Jina Markdown + LLM Structured Output 产出对比结果，AI SDK v6 流式 Chat 实现交互式追问。
- **关键取舍**：放弃真异步消息队列（任务在进程内存 Map 中，重启丢失），换取单兵作战的极速迭代；禁用 Supabase RLS，用代码层 `user_id` 过滤替代行级安全策略，降低 POC 联调成本。
- **优先验证点（已验证）**：Jina 抓取延迟可接受（P90 ≈ 25s）；LLM Structured Output 解析正确率高；前端 Diff UI 左右分栏卡片实现成本低。

## 2. 范围与边界

- **系统边界**：前端为 Next.js Client Components（React 18）；后端为 Next.js API Routes；数据库为 Supabase Postgres；外部服务为 Jina Reader + LLM（OpenAI 兼容代理）。
- **影响面**：Greenfield 新项目，无存量上下游影响。
- **明确不做什么**：不引入 Redis；不引入真正的 MQ；不启用 Supabase RLS（用代码层过滤替代）；不实现 Cron Job。
- **不变量**：
  1. 所有耗时 API 必须秒级响应（返回 `pending`），长任务通过轮询感知进度。
  2. 未登录不得写入 `reports` 表，对应写操作必须携带 `user_id`。
  3. PATCH 类接口必须加 `.eq('user_id', session.user.id)` 防止越权写。

## 3. 推荐方案（Next.js 伪异步 + Supabase 多租户架构）

### 3.1 C4-L1：System Context（系统上下文）

- **用户**：已注册登录的情报分析师 / 产品经理。
- **外部系统**：
  1. Jina Reader (`r.jina.ai`)：提取竞品网站的结构化 Markdown（本地 URL 直接 fetch 绕过）。
  2. LLM 服务（OpenAI / 兼容代理）：分析 Markdown 内容，产出结构化 JSON 包含 companyProfile、Diff 和行动建议；同时承接流式 Chat 追问。
  3. Supabase：身份鉴权（SSR Cookie 模式）+ Postgres 数据落盘。
- **系统边界**：OneKunDay Next.js App（`localhost:3000` 或 Vercel 部署）。
- **关键交互**：用户提交 `url` -> 系统返回 `taskId` -> 前端轮询 `taskId` 状态 -> 返回完整 `ReportData` + 写库 -> 前端更新时间轴与未读计数 -> 用户打开 AI Chat 追问。

### 3.2 C4-L2：Container（容器/部署单元）

- **Next.js Frontend**：负责页面布局（Dashboard 侧边栏 + 内容区）、任务控制面板、时间轴历史报告、报告分享页、全局 AI 悬浮追问组件。
- **Next.js API Routes**：
  - `/api/targets` – CRUD 监控任务（monitor_targets 表）。
  - `/api/analyze` – 触发/查询分析任务（内存 Map `taskStore` + Supabase 落盘）。
  - `/api/reports` – 查询/标记已读 reports 表。
  - `/api/feedback` – 读写 report_feedbacks 表（反馈持久化）。
  - `/api/chat` – 基于 AI SDK v6 的流式 Chat（Vercel AI `streamText` + `toUIMessageStreamResponse`）。
- **Supabase Postgres**：存储 `monitor_targets`、`reports`、`report_feedbacks` 三张表。

### 3.3 C4-L3：Component（组件）

- **`AnalyzeController`**（`/api/analyze` POST）：校验 URL 格式/协议/长度 -> 生成 `taskId` -> 同步拉取历史报告（供 LLM 真实 Diff 用）-> 立即响应 `pending`。
- **`ProcessTask Worker`**（`processAnalysisTask` 异步函数）：
  1. 无 OpenAI Key 时降级 Mock（`requiresLogin` 标记防止未登录误导）。
  2. `JinaFetcher`：本地 URL 直接 fetch；外部 URL 走 `r.jina.ai`。
  3. `LLMAnalyzer`：将 Markdown + 历史摘要传入，用 `generateObject`（Zod schema）强类型输出 `ReportData`。
  4. `saveToDatabase`：写 Supabase `reports` 表；更新 `monitor_targets.unread_count`。
  5. 更新 `taskStore` 状态（`completed` + `requiresLogin` flag）。
- **`PollingEndpoint`**（`/api/analyze` GET）：返回 `taskStore` 条目，前端 2s 轮询。
- **`GlobalChatWidget`**（`src/components/GlobalChat.tsx`）：
  - `useChat`（`@ai-sdk/react` v3）管理消息流。
  - `historyCache`（`useRef` Map）按 `report.id` 保存/恢复对话历史。
  - 分享页（路由以 `/share` 开头）不渲染悬浮球。

### 3.4 关键决策与取舍（最终版）

| # | 决策点 | 选择 | 取舍理由 | 降级/替代 |
|---|---|---|---|---|
| D1 | 后端架构 | Next.js API Routes 内存 Map | 极简单仓库，无多端部署 | 若进程重启丢任务，改用 Supabase 表记录 taskId |
| D2 | 社媒数据抓取 | 已移除 Mock Reddit | 需求收敛：专注网站内容变化+价格对比，移除社媒噪音 | N/A |
| D3 | Diff 视图渲染 | LLM 输出新旧字段 + 前端双栏卡片 | 性价比最高，避免 AST Diff 成本 | 纯文本堆砌 |
| D4 | Auth & 数据隔离 | Supabase SSR Auth + 代码层 `user_id` 过滤 | 禁用 RLS 降低 POC 联调成本，代码层弥补安全性 | 上生产前必须启用 RLS |
| D5 | Chat 实现 | AI SDK v6 (`@ai-sdk/react` v3) 流式 SSE | 原生流式响应，`useChat` 封装状态管理 | 自行 fetch EventSource |
| D6 | 反馈持久化 | Supabase `report_feedbacks` 表 upsert | 同一用户对同一报告只保留最新反馈，简洁可查 | localStorage 降级（仍不持久） |

### 3.5 对外承诺要点（API 契约）

| 方法 | 路径 | 认证 | 关键参数 | 响应 |
|------|------|------|---------|------|
| POST | `/api/analyze` | 可选（未登录不落盘）| `{ url: string }` | `{ taskId, status:"pending" }` |
| GET | `/api/analyze` | 无 | `?taskId=` | `{ status, data?, requiresLogin? }` |
| GET | `/api/targets` | 必须 | - | `{ targets[] }` |
| POST/PATCH/DELETE | `/api/targets` | 必须 | `{ url, name?, frequency?, status? }` | 200 / 400 / 401 |
| GET | `/api/reports` | 必须 | `?url=` | `{ reports[] }` |
| PATCH | `/api/reports` | 必须 | `{ id, is_read }` | `{ success, updated }` |
| POST | `/api/feedback` | 必须 | `{ report_id, type }` | `{ success }` |
| GET | `/api/feedback` | 必须 | `?report_id=` | `{ type \| null }` |
| POST | `/api/chat` | 无（无用户数据写入）| `{ messages[], reportData? }` | SSE 流（UI Message 格式）|

## 4. 与现有系统的对齐

### 4.1 契约兼容性声明
- **模块**：`core/poc` — 全新扩展，无破坏性变更。

### 4.2 ADR 合规声明
- 本次方案即为项目首个架构决策集合，无须遵守历史 ADR。

### 4.3 状态机 / 领域事件
- 分析任务：`pending` → `completed`（含 `requiresLogin` flag） / `error`
- 监控目标：`active` ⇄ `paused`
- 报告：`is_read: false` → `is_read: true`

### 4.4 跨模块影响
- 无外部依赖系统受影响。

## 5. 影响分析

- **上下游系统影响**：依赖 Jina API（限流风险）、LLM API（延迟/费用风险）、Supabase（Auth + DB，免费额度足够 POC）。
- **运行与运维影响**：本地 `localhost:3000` 演示无需额外运维。若部署 Vercel，分析任务 P90 ≈ 25s，需 Pro Plan 延长超时限制（默认 10s）或保留本地演示方式。

## 6. 风险与验证清单（最终状态）

| # | 风险/假设 | 验证方式 | 成功信号 | 结果 |
|---|---|---|---|---|
| R1 | Vercel Timeout 截断异步任务 | 本地跑 40s 端点 | 顺利完成 | ✅ 本地演示稳定，Vercel 部署需关注超时 |
| R2 | Diff 渲染时间不够 | 左右对比卡片搭建 | 30 行 Tailwind 搞定 | ✅ 双栏卡片实现顺畅 |
| R3 | AI SDK 版本 API 变更 | 调试 useChat / streamText | 流式响应正常 | ✅ 已迁移至 ai v6 / @ai-sdk/react v3 |
| R4 | 越权写漏洞 | 代码审查 + 测试报告 | PATCH 含 user_id 过滤 | ✅ 已修复（BUG-02）|

## 7. 追溯链接

- `requirements/solution.md`：核心产品思路来源。
- `design/research.md`：Jina 抓取可用性结论来源。
- `implementation/plan.md`：任务清单与里程碑。
- `el/submissions/test-report.md`：全量用例测试报告（13 UC + 4 边界条件）。

## 8. 迭代记录

- 2026-06-16：初稿。确立 Next.js 单体伪异步架构与轮询/任务状态机设计；In/Out 边界为极简 POC，不含 Auth/DB。
- 2026-06-17：重大更新。实际落地范围大幅扩展：引入 Supabase Auth + 多租户数据库；添加任务控制中心、历史时间轴、未读计数、报告分享、AI 悬浮追问（GlobalChat）、反馈持久化（report_feedbacks）；修复 BUG-02（越权写）、BUG-04（URL 校验）、BUG-05（非 JSON 请求体）、BUG-03（未登录 UX 误导）、WARN-01（分享页 404）；移除社媒情绪模块。更新所有 API 契约、架构图与风险状态。
