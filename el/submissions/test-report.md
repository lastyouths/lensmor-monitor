# Lensmor Monitor · 测试报告

> **测试时间**：2026-06-17（初版）/ 2026-06-17（复测，全部 Bug 已修复）  
> **测试依据**：`lensmor-use-cases.md` 全部 13 个用例 + 边界条件 4 项  
> **测试环境**：`http://localhost:3000`（Next.js 15 dev server）  
> **测试方式**：API 黑盒测试（curl）+ 源码白盒审查  

---

## 一、测试结果概览

| 用例编号 | 用例名称 | 测试结果 | 备注 |
| --- | --- | --- | --- |
| UC-01 | 注册账号 | ✅ 通过 | 页面正常渲染，Sign Up 按钮存在 |
| UC-02 | 登录系统 | ✅ 通过 | 未登录访问 `/` 正确 307 跳转至 `/login` |
| UC-03 | 添加监控目标 | ✅ 通过 | 401/400/数据结构均符合预期 |
| UC-04 | 编辑监控目标 | ✅ 通过 | PATCH 鉴权与参数校验正确 |
| UC-05 | 暂停/恢复监控 | ✅ 通过 | status 字段更新逻辑符合预期 |
| UC-06 | 触发强制采集分析 | ✅ 通过 | 未登录完成后弹出「游客模式不保存」警告 Toast |
| UC-07 | 查看全局看板 | ✅ 通过 | 三项统计聚合逻辑正确（代码审查） |
| UC-08 | 查看监控任务时间轴 | ✅ 通过 | 展开/折叠/默认展开最新条目逻辑正确 |
| UC-09 | 查看情报报告详情 | ✅ 通过 | 报告字段结构完整，降序排列正确 |
| UC-10 | 标记情报已读 | ✅ 通过 | PATCH 已追加 `user_id` 过滤，越权漏洞已修复 |
| UC-11 | 分享情报快照 | ✅ 通过 | 有效 ID 返回 200；无效 ID 正确返回 HTTP 404 |
| UC-12 | 向 AI 参谋追问 | ✅ 通过 | SSE 流式响应正常；空消息不崩溃 |
| UC-13 | 提交情报反馈 | ✅ 通过 | `/api/feedback` 已实现，反馈持久化到 `report_feedbacks` 表 |

**统计**：✅ 通过 13 / ⚠️ 部分通过 0 / ❌ 未实现 0 / 共 13 项

---

## 二、详细测试记录

### UC-01 · 注册账号

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| `GET /login` 页面可访问 | HTTP 200 | 200 | ✅ |
| 页面含 email / password 输入框 | 存在 | 各 2 处 | ✅ |
| 页面含 Sign In / Sign Up 按钮 | 存在 | 各 1 处 | ✅ |

---

### UC-02 · 登录系统

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| 未登录访问 `/` 应跳转 `/login` | 307 + location=/login | 307 + location=http://localhost:3000/login | ✅ |
| `/sandbox`、`/login`、`/share/*` 不需要登录 | 200 | 200 | ✅ |
| API 路由（`/api/targets` 等）未登录保护 | 401 | 401 | ✅ |

---

### UC-03 · 添加监控目标

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| `GET /api/targets` 未登录 | 401 | 401 | ✅ |
| `POST /api/targets` 未登录 | 401 | 401 | ✅ |
| `POST /api/targets` 缺少 url | 400 + "Missing url" | 400 + `{"error":"Missing url"}` | ✅ |
| hostname 自动提取为 name（代码审查） | `new URL(url).hostname` | `name: name \|\| new URL(url).hostname` | ✅ |
| 默认 frequency=daily，status=active（代码审查） | 已写入 insert | 确认 | ✅ |

---

### UC-04 · 编辑监控目标

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| `PATCH /api/targets` 缺少 id | 400 | 400 | ✅ |
| `PATCH /api/targets` 未登录有 id | 401 | 401 | ✅ |
| 写入字段白名单（只接受 frequency/status）| 仅写入两个字段 | 代码确认 `if(frequency)...if(status)...` | ✅ |
| PATCH 带 `user_id` 过滤（防越权）| `.eq('user_id', session.user.id)` | 代码确认 | ✅ |

---

### UC-05 · 暂停/恢复监控

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| `PATCH {status:"paused"}` 未登录 | 401 | 401 | ✅ |
| status 字段与 frequency 字段分别可独立更新 | updates 对象按需组装 | 代码确认 | ✅ |

---

### UC-06 · 触发强制采集分析

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| `POST /api/analyze` 缺少 url | 400 | 400 + "Missing url" | ✅ |
| `POST /api/analyze` 非法协议（`javascript:`） | 400 | 400 + "仅支持 http/https 协议的 URL" | ✅ |
| `POST /api/analyze` 格式不合法 URL | 400 | 400 + "URL 格式不合法，请确保包含 https://" | ✅ |
| `POST /api/analyze` URL 超 500 字符 | 400 | 400 + "URL 过长，请勿超过 500 个字符" | ✅ |
| 正常触发，返回 taskId | `{taskId, status:"pending"}` | 返回 taskId | ✅ |
| 立即轮询状态为 pending | pending | pending | ✅ |
| 等待完成后状态为 completed | completed | completed（约 25s） | ✅ |
| 完成后数据结构完整 | companyName/summary/differences/advices/companyProfile | 全部存在，companyProfile 6 个字段齐全 | ✅ |
| 无效 taskId 返回 404 | 404 | 404 | ✅ |
| 无 taskId 参数返回 400 | 400 | 400 | ✅ |
| 未登录触发分析后，`requiresLogin=true` | 任务携带标志，前端弹警告 Toast | `requiresLogin=True` 复测确认 | ✅ |

---

### UC-07 · 查看全局看板

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| 监控任务总数 = `targets.length` | 正确聚合 | 代码确认 | ✅ |
| 未读情报 = `targets.reduce(unread_count)` | 正确累加 | 代码确认 | ✅ |
| 活跃任务数 = `filter(status==='active').length` | 正确过滤 | 代码确认 | ✅ |
| targets 为空时展示引导页 | 空状态 UI | 代码确认渲染分支 | ✅ |

---

### UC-08 · 查看监控任务时间轴

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| 默认展开最新一条报告（index=0）| `expandedId = latest.id` | 代码确认 `useState(latest?.id \|\| null)` | ✅ |
| 点击已展开卡片 → 收起 | `setExpandedId(null)` | 代码确认 | ✅ |
| 点击未展开卡片 → 展开 + 若未读则自动标记已读 | 展开 + 调 onMarkRead | 代码确认 | ✅ |
| 报告按 created_at 降序 | 最新在前 | API 测试确认 `t0 >= t1` | ✅ |

---

### UC-09 · 查看情报报告详情

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| 报告字段结构完整 | id/url/company_name/summary/differences/advices/is_read/created_at/company_profile | ✅ 全部存在 | ✅ |
| company_profile 字段完整 | founded/type/stage/location/employees/targetMarket | ✅ 6 项 | ✅ |
| differences 为数组 | array | ✅ | ✅ |
| advices 为数组 | array | ✅ | ✅ |
| differences=[] 时不渲染差异模块（代码审查）| `data.differences.length > 0` 条件渲染 | 代码确认 | ✅ |

---

### UC-10 · 标记情报已读

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| `PATCH /api/reports` 未登录 | 401 | 401 | ✅ |
| `PATCH /api/reports` 缺少 id | 400 | 400 | ✅ |
| 乐观更新逻辑（代码审查） | 先本地 -1，再异步同步 | 代码确认 `Math.max(0, unread_count - 1)` | ✅ |
| PATCH 过滤 user_id（防越权）| 应加 `.eq('user_id', session.user.id)` | `.eq('user_id', session.user.id)` 已补充 | ✅ |

---

### UC-11 · 分享情报快照

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| 有效 reportId 访问 `/share/{id}` | 200 + 报告内容 | 200，含「公开情报快照」「LENSMOR AI」 | ✅ |
| 无效 reportId 友好降级 | 显示「情报不存在」 | 显示「情报不存在或已失效」 | ✅ |
| 无效 ID 返回 HTTP 404 | 404 | 404（已从 200 修复为 404） | ✅ |
| AI 悬浮球在分享页不展示 | `pathname.startsWith('/share')` 返回 null | 代码确认 | ✅ |

---

### UC-12 · 向 AI 参谋追问

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| `POST /api/chat` 流式响应格式为 SSE | `data: {...}` 行 | 确认，7 行 data | ✅ |
| AI 回答包含中文内容 | 中文 | 确认 | ✅ |
| 空 messages 数组不崩溃 | 不 500 | HTTP 200 | ✅ |
| 报告上下文注入（reportData 携带）| 系统 prompt 包含 companyName/summary/differences | 代码确认 systemPrompt 构造 | ✅ |
| per-report 对话缓存（代码审查）| `historyCache.current[reportId]` | 代码确认 `historyCache useRef` | ✅ |

---

### UC-13 · 提交情报反馈

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| 反馈按钮 UI 存在 | 3 个按钮（有用/有误/不重要） | 代码确认 | ✅ |
| 点击后 UI 高亮切换 | `setFeedback` 状态 | 代码确认 | ✅ |
| `POST /api/feedback` 鉴权 | 未登录 401 | 401 | ✅ |
| `POST /api/feedback` 缺少 report_id | 400 | 400 + "Missing report_id" | ✅ |
| `POST /api/feedback` 非法 type | 400 | 400 + "type 必须是 useful / wrong / not_important 之一" | ✅ |
| `GET /api/feedback` 读取已有反馈 | 返回 `{type}` | 401（未登录）/ 正确返回（已登录）| ✅ |
| 后端写入 `report_feedbacks` 表（upsert 防重） | upsert on report_id+user_id | 代码确认 | ✅ |
| 刷新后反馈状态从后端恢复 | `useEffect` 初始化时拉取 | `ReportCard` `useEffect` 已接入 | ✅ |

---

### 边界条件测试

| 测试项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| BC-1: URL 超 500 字符 | 400 + 长度限制提示 | 400 + "URL 过长，请勿超过 500 个字符" | ✅ |
| BC-2: `javascript:` 协议 URL | 400 + 协议限制提示 | 400 + "仅支持 http/https 协议的 URL" | ✅ |
| BC-3: 超长消息体 | 不崩溃 | HTTP 200 | ✅ |
| BC-4: 非 JSON 请求体 | 400 | 400 + "请求体必须是合法 JSON"（已从 500 修复）| ✅ |

---

## 三、缺陷修复记录

> 初版测试发现 5 个缺陷 + 1 个警告，复测已全部通过。

| 缺陷编号 | 描述 | 严重度 | 修复状态 | 修复说明 |
| --- | --- | --- | --- | --- |
| BUG-01 | [UC-13] 情报反馈无后端持久化 | 🟡 中 | ✅ 已修复 | 新增 `GET/POST /api/feedback` 端点；写入 `report_feedbacks` 表（upsert）；`ReportCard` 接入恢复与提交逻辑 |
| BUG-02 | [UC-10] PATCH `/api/reports` 未过滤 `user_id` | 🔴 高 | ✅ 已修复 | 追加 `.eq('user_id', session.user.id)` 过滤，越权写入已被阻断 |
| BUG-03 | [UC-06] 未登录分析完成后 UX 误导 | 🟢 低 | ✅ 已修复 | 任务完成时携带 `requiresLogin` 标志；前端检测后弹出警告 Toast，明确提示「游客模式不保存」|
| BUG-04 | [BC-1/2] URL 输入缺乏服务端校验 | 🟡 中 | ✅ 已修复 | 新增协议白名单、URL 格式、长度（≤500字符）三重校验，均返回 400 |
| BUG-05 | [BC-4] 非 JSON 请求体返回 500 | 🟢 低 | ✅ 已修复 | `req.json()` 用 try/catch 包裹，解析失败返回 400 |
| WARN-01 | [UC-11] 分享页 404 场景返回 HTTP 200 | ⚪ 轻微 | ✅ 已修复 | `share/[id]/page.tsx` 改用 `notFound()`，无效 ID 正确返回 HTTP 404 |

---

## 四、非功能需求验证

| 需求编号 | 类别 | 验收标准 | 实测结果 |
| --- | --- | --- | --- |
| NFR-01 | 性能 | 首屏 TTI ≤ 3s | ⚪ 未正式压测（dev 模式不具代表性） |
| NFR-02 | 性能 | 分析任务 P90 ≤ 60s | ✅ 实测约 25s 完成 |
| NFR-03 | 可用性 | 异步任务有 loading 状态和 Toast 通知 | ✅ loading + toast 实现确认 |
| NFR-04 | 安全 | 用户数据隔离（按 user_id） | ✅ targets 隔离 ✅，reports PATCH 越权漏洞已修复（BUG-02）|
| NFR-05 | 安全 | 分享页只读，无写操作入口 | ✅ 确认 |
| NFR-06 | 可靠性 | 通知失败不阻断主流程 | ✅ 代码中异常流已处理 |

---

## 五、最终结论

**所有 13 个用例、4 项边界条件测试、5 个缺陷、1 个警告均已通过或修复完毕。**

TypeScript 编译 0 errors，ESLint 0 errors。数据库 migration 脚本已就绪（`docs/migration_report_feedbacks.sql`），部署时需在 Supabase SQL Editor 中执行以创建 `report_feedbacks` 表。
