"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SandboxContent() {
  const searchParams = useSearchParams();
  const version = searchParams.get("v") === "2" ? 2 : 1;

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      {/* 版本切换条 */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#f1f5f9", borderRadius: "8px", fontSize: "13px" }}>
        <span style={{ color: "#64748b", fontWeight: 600 }}>🧪 测试版本：</span>
        <a href="/sandbox?v=1" style={{ padding: "4px 14px", borderRadius: "6px", textDecoration: "none", fontWeight: 600, backgroundColor: version === 1 ? "#4f46e5" : "white", color: version === 1 ? "white" : "#64748b", border: "1px solid #e2e8f0" }}>
          v1 基础版
        </a>
        <a href="/sandbox?v=2" style={{ padding: "4px 14px", borderRadius: "6px", textDecoration: "none", fontWeight: 600, backgroundColor: version === 2 ? "#4f46e5" : "white", color: version === 2 ? "white" : "#64748b", border: "1px solid #e2e8f0" }}>
          v2 豪华版
        </a>
        <span style={{ marginLeft: "auto", color: "#94a3b8" }}>当前：<strong style={{ color: "#4f46e5" }}>v{version}</strong></span>
      </div>

      <h1>Lensmor 测试官网</h1>
      <p>这是一个用于测试 Lensmor Monitor 差异对比引擎的虚拟网站。</p>

      <section style={{ marginTop: "30px" }}>
        <h2>🔥 核心特性</h2>
        <ul>
          <li>基于最新的 AI 大模型驱动</li>
          <li>支持多租户架构隔离</li>
          <li>支持 Jina Reader 网页快照提取</li>
        </ul>
      </section>

      <section style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
        <h2>💰 定价方案</h2>
        <p>目前我们处于内测阶段，提供以下极具性价比的套餐：</p>
        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
          {/* 基础版 */}
          <div style={{ flex: 1, padding: "20px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <h3>基础版 (Basic)</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4f46e5" }}>$41.99 / 月</p>
            <p>适合个人开发者，支持最多 4 个监控任务。</p>
          </div>

          {/* 企业版 */}
          {version === 1 ? (
            <div style={{ flex: 1, padding: "20px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <h3>企业版 (Pro)</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4f46e5" }}>$79.99 / 月</p>
              <p>适合中小型企业，支持无限任务与 API 接入。</p>
            </div>
          ) : (
            <div style={{ flex: 1, padding: "20px", backgroundColor: "#fffbeb", border: "2px solid #fbbf24", borderRadius: "8px", position: "relative" }}>
              <div style={{ position: "absolute", top: "-10px", right: "20px", backgroundColor: "#fbbf24", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                👑 最受欢迎
              </div>
              <h3>企业版 (Pro)</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4f46e5" }}>$199.99 / 月</p>
              <p>适合中小型企业，支持无限任务与 API 接入。</p>
              <div style={{ marginTop: "15px", textAlign: "center" }}>
                <img
                  src="https://via.placeholder.com/150x80?text=Pro+Dashboard+Preview"
                  alt="企业版高级看板预览图"
                  style={{ borderRadius: "4px", width: "100%" }}
                />
                <p style={{ fontSize: "10px", color: "#6b7280", marginTop: "5px" }}>新增了强大的 BI 看板与数据导出功能</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: "30px" }}>
        <h2>📞 联系我们</h2>
        <p>Email: contact@lensmor.test</p>
      </section>

      <div style={{ marginTop: "50px", fontSize: "13px", color: "#64748b", backgroundColor: "#f8fafc", padding: "15px", borderRadius: "8px" }}>
        <strong>💡 测试玩法：</strong><br />
        当前为 <strong>v{version} {version === 1 ? "基础版" : "豪华版"}</strong>。<br />
        1. 先在 Lensmor 控制台对 <code>http://localhost:3000/sandbox?v={version}</code> 触发一次分析，让 AI 记住当前页面。<br />
        2. 点击上方切换到另一个版本（URL 中 v 参数变化）。<br />
        3. 再次触发分析，AI 就会对比出差异！
      </div>
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense>
      <SandboxContent />
    </Suspense>
  );
}
