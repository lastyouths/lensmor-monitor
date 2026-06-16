---
title: D1 Research Template
status: draft
---

## 基本信息

- Date：2026-06-16
- Feature：Lensmor Monitor POC
- Spec（分支 / ID）：001-lensmor-poc
- 作者：AI

## Research Tasks Completed

### T1. 外部数据源（Jina Reader）连通性与稳定性验证

**Task**: 验证 Jina Reader 接口（`https://r.jina.ai/`）在 POC 期间直接提取网页的连通性、响应速度与 Markdown 内容质量。

**研究发现**：
- 测试了对 Supabase 官网的提取。
- 请求大约耗时 37 秒。
- **内容质量极高**，成功提取了 49977 字符的结构化 Markdown，无多余的反爬错误，直接返回了标题、导航、核心正文等信息。

**Decision**：**确定采用 Jina Reader 作为 POC 网页采集核心引擎**。

**Rationale**：
- POC 的核心是向 LLM 提供“可读”的网站变更输入，而 Jina 输出的 Markdown 正是 LLM 最容易理解的结构。
- 尽管单次耗时偏长（30+秒），但这完全符合我们先前的决策：在 Next.js 端建立一个“后台任务正在执行”的加载/轮询状态体验。耗时不仅是劣势，反而给了前端展示“伪异步”过程的机会。

**Alternatives considered**：
- **方案 A（直接使用 Wayback Machine API）**：不选原因：Wayback 的 CDX API 只返回历史快照列表，最终仍需拉取具体的 HTML，解析起来极为复杂，不适合 POC 快速得出纯文本结果。
- **方案 B（Puppeteer 截图）**：不选原因：需要跑无头浏览器，占用极大资源且提取不了可供 LLM 进行 Diff 对比的语义级文本。

**Evidence**：
- 脚本验证路径：`/Users/lizhenbang/OneKunDay/.aisdlc/specs/001-lensmor-poc/design/scripts/poc_fetch_test.js`
- 成功抓取样例输出可见：`/Users/lizhenbang/.cursor/projects/Users-lizhenbang-OneKunDay/terminals/597496.txt`

### T2. 社交媒体数据源 (Thordata / Reddit) 的接入策略

**Task**: 验证 Thordata 或官方 Reddit API 用于社媒情绪提取的可用性。

**研究发现**：
- 由于 Thordata 需要外部注册的 API Key，且当前用户未提供，无法完成真实接口打通测试。

**Decision**：**POC 阶段，社媒舆情（Reddit 评论与情绪分析）降级采用 Mock 数据**。

**Rationale**：
- 在缺少密钥的前提下强行对接 API，不仅无法跑通，还会阻塞整个 POC 的进度。
- 采用 Mock 数据已经足以在前端展示“情绪分析雷达与关键观点”的视觉冲击力（我们的重点在于表现层的 WOW factor）。

**Alternatives considered**：
- **方案 A（立即注册 Thordata 账号获取 Key）**：不选原因：对于一个周末级别的 POC 项目，外部账号的充值或审核流程耗时不可控，可能拖慢整体交付节奏。
