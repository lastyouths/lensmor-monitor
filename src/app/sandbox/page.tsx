import { getContent } from "../../lib/sandboxStore";
import { SandboxEditor } from "./SandboxEditor";

// Server Component：每次请求时从 store 读取最新内容，直接渲染到 HTML
// Jina / 直接 fetch 拿到的 HTML 已包含最新修改内容
export default function SandboxPage() {
  const content = getContent();

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "860px", margin: "0 auto", padding: "40px 20px" }}>
      <SandboxEditor initialContent={content} />

      {/* 以下为服务端渲染内容，Jina 抓取时可直接读取 */}
      <h1>{content.title}</h1>
      <p style={{ color: "#475569", marginTop: "8px" }}>{content.description}</p>

      <section style={{ marginTop: "30px" }}>
        <h2>🔥 核心特性</h2>
        <ul>
          {content.features.map((f, i) => (
            <li key={i} style={{ marginBottom: "6px" }}>{f}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
        <h2>💰 定价方案</h2>
        <p>目前我们处于内测阶段，提供以下极具性价比的套餐：</p>
        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
          <div style={{ flex: 1, padding: "20px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <h3>基础版 (Basic)</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4f46e5" }}>{content.basicPrice}</p>
            <p>{content.basicDesc}</p>
          </div>
          <div style={{
            flex: 1, padding: "20px", position: "relative",
            backgroundColor: content.proTag ? "#fffbeb" : "white",
            borderRadius: "8px",
            border: content.proTag ? "2px solid #fbbf24" : "1px solid #e5e7eb",
          }}>
            {content.proTag && (
              <div style={{ position: "absolute", top: "-10px", right: "20px", backgroundColor: "#fbbf24", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                {content.proTag}
              </div>
            )}
            <h3>企业版 (Pro)</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4f46e5" }}>{content.proPrice}</p>
            <p>{content.proDesc}</p>
          </div>
        </div>
      </section>

      <section style={{ marginTop: "30px" }}>
        <h2>📞 联系我们</h2>
        <p>Email: {content.email}</p>
      </section>

      <div style={{ marginTop: "50px", fontSize: "12px", color: "#94a3b8", padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "8px", lineHeight: "1.8" }}>
        💡 点击「<strong>✏️ 编辑内容</strong>」修改任意文字 → 「<strong>✅ 保存生效</strong>」→ 在 Lensmor 控制台对此页面触发分析，AI 将对比前后差异。
      </div>
    </div>
  );
}
