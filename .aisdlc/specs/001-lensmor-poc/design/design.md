---
title: D2 Design（Lensmor Monitor POC）
status: draft
---

## 0. 基本信息

- 需求标识（分支 / ID）：001-lensmor-poc
- 标题（需求名 / RFC 名）：Lensmor Monitor POC - 极简伪异步架构与差异可视化设计
- 作者：AI
- 评审人：Product
- 状态：draft
- 最后更新：2026-06-16

## 1. 结论摘要（3–7 行）

- **一句话目标**：用最低架构成本（Next.js API Route 通吃）快速验证竞品监控核心闭环（采集 -> 分析 -> 差异比对 -> 建议）。
- **In / Out 边界**：In（输入URL、Jina真数据抓取、Mock Reddit 数据、差异展示卡片、前端伪异步排队体验）；Out（正式数据库落盘、用户系统、Cron、Supabase Edge Functions）。
- **推荐方案**：以 Next.js Server Actions / Route Handlers 承载后端任务，基于状态轮询营造异步体感，结合 Jina Markdown 喂给 LLM 产出对比结果。
- **关键取舍**：放弃真异步消息队列带来的容灾与分布式调度能力，换取单兵作战的极速迭代。
- **优先验证点**：R1 (Diff 渲染复杂度)、R2 (LLM 解析超长 Markdown 的延迟)。

## 2. 范围与边界

- **系统边界**：前端为单一交互页面；后端为 Next.js `/api/analyze` 路由；依赖外部（Jina Reader、LLM API）。
- **影响面**：新增一个 Next.js 项目骨架，属于 Greenfield。无存量上下游影响。
- **明确不做什么**：不引入 Redis，不引入真正的 MQ（Message Queue），不写复杂的数据库鉴权 (RLS) 与租户隔离。
- **不变量**：所有需要几十秒处理的接口调用，绝对不能阻塞主线程渲染；必须通过前端轮询或 Server-Sent Events (SSE) 展现进度。

## 3. 推荐方案（Next.js 伪异步架构）

### 3.1 C4-L1：System Context（系统上下文）

- **用户**：POC 演示者 / 内部体验者。
- **外部系统**：
  1. Jina Reader (`r.jina.ai`)：提取竞品网站的结构化 Markdown。
  2. LLM 服务（OpenAI/Anthropic）：分析 Markdown 内容，产出结构化 JSON 包含 Diff 和行动建议。
- **系统边界**：OneKunDay Next.js App。
- **关键交互**：用户提交 `targetUrl` -> 系统返回 `taskId` -> 用户轮询 `taskId` 状态 -> 系统返回处理完成的分析报告卡片数据。

### 3.2 C4-L2：Container（容器/部署单元）

- **Next.js Frontend (React Server Components / Client Components)**：负责页面布局、表单提交、状态骨架屏、复杂的 Diff 可视化渲染。
- **Next.js API Route (Backend)**：承接分析请求。
  - **内存/轻量DB存储区**：为了不丢失状态，用一个极其简易的全局变量字典或简单的 SQLite/Supabase 表记录 `taskId -> status -> result`。POC 优先用内存 Map (开发阶段) 或简单的 DB 记录。

### 3.3 C4-L3：Component（组件）

- **`Analyze Controller`**：接收前端请求，生成 `taskId`。立即响应给前端。触发内部后台 `ProcessTask`。
- **`ProcessTask Worker`**：
  1. 调用 `JinaFetcher` 获取目标站点 MD。
  2. （可选）查询 Mock 库补充 Reddit 假数据。
  3. 调用 `LLMAnalyzer`：将 MD 和 Mock 数据传给大模型，要求以 JSON 格式返回变更摘要、详细差异点、以及行动建议清单。
  4. 写回任务状态。
- **`Polling Endpoint`**：前端周期性调用此接口获取任务最新进度与最终结果。

### 3.4 关键决策与取舍

| # | 决策点 | 选择 | 取舍理由（为什么选它） | 若不满足前提的降级/替代 |
|---|---|---|---|---|
| D1 | 后端架构 | Next.js API Routes | 开发资源极简，单仓库不用多端部署，完全满足演示期的吞吐需求。 | 如果 Vercel 强杀后台进程，改用 Edge Runtime 或增加前端流式（Streaming）等待。 |
| D2 | 社媒数据抓取 | Mock 数据 | 缺 Thordata Key，避免因为对接不熟悉的第三方平台阻塞整个 POC 主进度。 | 如果拿到 Key 则写一个简单的 fetcher 替换掉 mock_data.json。 |
| D3 | Diff 视图渲染方式 | 双栏文本对比卡片 | 手写或接入复杂 AST Diff 会极速消耗前端时间，采用“LLM 直接结构化输出新旧对比字段”并在前端用左右或上下卡片渲染，性价比最高。 | 纯文本堆砌（如果卡片 UI 也难做）。 |

### 3.5 对外承诺要点

- **契约（API）**：
  - `POST /api/analyze` 接收 `{ targetUrl }`，返回 `{ taskId, status: "pending" }`。
  - `GET /api/tasks/:id` 返回 `{ taskId, status: "completed", data: {...} }`。
- **数据口径**：LLM 吐出的数据必须强校验为 JSON 格式（使用 Structured Outputs 或 `response_format`），格式如 `{ summary, differences: [{old, new, reasoning}], advices: [] }`。

## 4. 与现有系统的对齐

因为此项目为 Greenfield POC，当前没有任何历史代码、受影响模块（`project/components/*`）或 ADR（`project/adr/*`）。

### 4.1 契约兼容性声明（逐模块）
- **模块**：`core/poc`
  - 兼容性结论：全新扩展，无破坏性变更。

### 4.2 ADR 合规声明（逐 ADR）
- 本次方案即为项目首个架构决策，无须遵守历史 ADR。

### 4.3 状态机 / 领域事件影响
- 任务状态机：`pending` -> `processing` -> `completed` / `error`。（全新定义）。

### 4.4 跨模块影响确认
- 无。

## 5. 影响分析

- **上下游系统影响**：需要确保能正常调用外部 LLM API 和 Jina API。
- **运行与运维影响**：POC 演示无需特别考虑容量；若在 Vercel 免费版部署，注意 Serverless Function 的 Timeout 限制（默认 10-15秒）。对于需时长达 30 秒以上的 Jina 请求，可能必须采用特殊方案：比如本地部署演示，或升级 Vercel Pro 设置长 Timeout，抑或改用 Streaming Response 长连接保持活跃。

## 6. 风险与验证清单

| # | 风险/假设 | 验证方式 | 成功信号 | 失败信号 | Owner | 截止 | 下一步动作 |
|---|---|---|---|---|---|---|---|
| R1 | Vercel Timeout 截断异步任务 | 将此代码直接丢到 Vercel 部署一个空跑 40 秒的端点测试 | 端点顺利跑完 40 秒并返回完成状态 | 端点 10 秒后报 504 Gateway Timeout | DEV | I1 期间 | 如果失败，POC 演示改为在本地起 `localhost:3000` 投屏，或采用 Streaming 流式响应。 |
| R2 | Diff 渲染时间不够 | 前端快速搭建左右对比卡片 | 能用 30 行以内的 Tailwind 排好版 | 写起来非常吃力 | DEV | UI 开发时 | 降级为单纯的列表堆叠显示“变更前”和“变更后”。 |

## 7. 追溯链接

- `requirements/solution.md`：核心产品思路来源。
- `design/research.md`：Jina 抓取可用性结论来源。

## 8. 迭代记录

- 2026-06-16：初稿。确立 Next.js 单体伪异步架构与轮询/任务状态机设计；识别 Vercel 超时风险。
