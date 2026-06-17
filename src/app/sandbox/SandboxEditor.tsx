"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SandboxData } from "../../lib/sandboxStore";

function EditableText({
  value,
  onChange,
  tag = "span",
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  tag?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  const Tag = tag as "span";
  return (
    <Tag
      ref={ref as React.RefObject<HTMLSpanElement>}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange((e.currentTarget as HTMLElement).innerText)}
      style={{
        ...style,
        outline: "2px dashed #6366f1",
        borderRadius: "4px",
        padding: "2px 4px",
        minWidth: "40px",
        cursor: "text",
        backgroundColor: "rgba(99,102,241,0.06)",
      }}
    />
  );
}

export function SandboxEditor({ initialContent }: { initialContent: SandboxData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState<SandboxData>(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof SandboxData>(key: K, val: SandboxData[K]) {
    setContent(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    const ts = Date.now();
    await fetch(`/api/sandbox?t=${ts}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh(); // 触发 Server Component 重新读取 store，更新 SSR HTML
  }

  async function handleReset() {
    if (!confirm("确认恢复默认内容？")) return;
    const ts = Date.now();
    await fetch(`/api/sandbox?t=${ts}`, { method: "DELETE" });
    router.refresh();
    setEditing(false);
  }

  return (
    <>
      {/* 工具栏 */}
      <div style={{
        marginBottom: "28px", display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 16px", backgroundColor: editing ? "#eef2ff" : "#f8fafc",
        borderRadius: "10px", border: `1px solid ${editing ? "#a5b4fc" : "#e2e8f0"}`,
        fontSize: "13px",
      }}>
        <span style={{ color: "#64748b" }}>🧪 Lensmor 沙盒页</span>
        <span style={{ flex: 1 }} />
        {editing ? (
          <>
            <span style={{ color: "#6366f1", fontSize: "12px" }}>✏️ 点击任意文字直接编辑</span>
            <button onClick={handleReset} style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", cursor: "pointer", fontSize: "12px" }}>恢复默认</button>
            <button onClick={() => { setEditing(false); setContent(initialContent); }} style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", cursor: "pointer", fontSize: "12px" }}>取消</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "5px 14px", borderRadius: "6px", border: "none", background: "#4f46e5", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
              {saving ? "保存中…" : "✅ 保存生效"}
            </button>
          </>
        ) : (
          <>
            {saved && <span style={{ color: "#16a34a", fontSize: "12px" }}>✅ 已保存，Jina 可抓取新内容了</span>}
            <button onClick={() => setEditing(true)} style={{ padding: "5px 14px", borderRadius: "6px", border: "1px solid #a5b4fc", background: "white", color: "#4f46e5", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
              ✏️ 编辑内容
            </button>
          </>
        )}
      </div>

      {/* 编辑态覆盖内容 */}
      {editing && (
        <div>
          <EditableText tag="h1" value={content.title} onChange={v => update("title", v)} />
          <EditableText tag="p" value={content.description} onChange={v => update("description", v)} style={{ color: "#475569", marginTop: "8px" }} />

          <section style={{ marginTop: "30px" }}>
            <h2>🔥 核心特性</h2>
            <ul>
              {content.features.map((f, i) => (
                <li key={i} style={{ marginBottom: "6px" }}>
                  <EditableText value={f} onChange={v => {
                    const next = [...content.features];
                    next[i] = v;
                    update("features", next);
                  }} />
                </li>
              ))}
            </ul>
          </section>

          <section style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
            <h2>💰 定价方案</h2>
            <p>目前我们处于内测阶段，提供以下极具性价比的套餐：</p>
            <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
              <div style={{ flex: 1, padding: "20px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <h3>基础版 (Basic)</h3>
                <EditableText tag="p" value={content.basicPrice} onChange={v => update("basicPrice", v)} style={{ fontSize: "24px", fontWeight: "bold", color: "#4f46e5" }} />
                <EditableText tag="p" value={content.basicDesc} onChange={v => update("basicDesc", v)} />
              </div>
              <div style={{ flex: 1, padding: "20px", backgroundColor: content.proTag ? "#fffbeb" : "white", borderRadius: "8px", border: content.proTag ? "2px solid #fbbf24" : "1px solid #e5e7eb", position: "relative" }}>
                {content.proTag ? (
                  <div style={{ position: "absolute", top: "-10px", right: "20px", backgroundColor: "#fbbf24", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                    <EditableText value={content.proTag} onChange={v => update("proTag", v)} />
                  </div>
                ) : (
                  <button onClick={() => update("proTag", "👑 最受欢迎")} style={{ fontSize: "11px", color: "#9ca3af", border: "1px dashed #d1d5db", borderRadius: "4px", padding: "2px 8px", background: "none", cursor: "pointer", marginBottom: "8px" }}>
                    + 添加徽章
                  </button>
                )}
                <h3>企业版 (Pro)</h3>
                <EditableText tag="p" value={content.proPrice} onChange={v => update("proPrice", v)} style={{ fontSize: "24px", fontWeight: "bold", color: "#4f46e5" }} />
                <EditableText tag="p" value={content.proDesc} onChange={v => update("proDesc", v)} />
              </div>
            </div>
          </section>

          <section style={{ marginTop: "30px" }}>
            <h2>📞 联系我们</h2>
            <p>Email: <EditableText value={content.email} onChange={v => update("email", v)} /></p>
          </section>
        </div>
      )}
    </>
  );
}
