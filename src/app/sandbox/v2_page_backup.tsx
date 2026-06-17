export default function SandboxPage() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
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
          <div style={{ flex: 1, padding: "20px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <h3>基础版 (Basic)</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4f46e5" }}>$41.99 / 月</p>
            <p>适合个人开发者，支持最多 4 个监控任务。</p>
          </div>
          
          <div style={{ flex: 1, padding: "20px", backgroundColor: "#fffbeb", border: "2px solid #fbbf24", borderRadius: "8px", position: "relative" }}>
            {/* 新增的结构：推荐徽章 */}
            <div style={{ position: "absolute", top: "-10px", right: "20px", backgroundColor: "#fbbf24", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
              👑 最受欢迎
            </div>
            
            <h3>企业版 (Pro)</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4f46e5" }}>$199.99 / 月</p>
            <p>适合中小型企业，支持无限任务与 API 接入。</p>
            
            {/* 新增的结构：产品展示大图 */}
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <img 
                src="https://via.placeholder.com/150x80?text=Pro+Dashboard+Preview" 
                alt="企业版高级看板预览图" 
                style={{ borderRadius: "4px", width: "100%" }}
              />
              <p style={{ fontSize: "10px", color: "#6b7280", marginTop: "5px" }}>新增了强大的 BI 看板与数据导出功能</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: "30px" }}>
        <h2>📞 联系我们</h2>
        <p>Email: contact@lensmor.test</p>
      </section>
      
      <div style={{ marginTop: "50px", fontSize: "13px", color: "#64748b", backgroundColor: "#f8fafc", padding: "15px", borderRadius: "8px" }}>
        <strong>💡 终极测试玩法：</strong><br />
        这是 <strong>v2 豪华版本</strong>。<br/>
        1. 先去控制台强制刷新一次，让 AI 记住这副“豪华”的模样。<br/>
        2. 然后在 IDE 中，删掉当前的 <code>page.tsx</code>。<br/>
        3. 把旁边的 <code>v1_page_backup.tsx</code> 重命名为 <code>page.tsx</code>。<br/>
        4. 再去控制台点强刷，AI 就会发现页面遭到降级和删减了！
      </div>
    </div>
  );
}
