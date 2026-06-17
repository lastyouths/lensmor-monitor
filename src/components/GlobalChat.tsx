"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Bot, User, Send, Sparkles, Loader2, MessageSquare, X, Maximize2, Minimize2 } from "lucide-react";
import { ReportData } from "../app/mock_data";

interface ChatContextType {
  isOpen: boolean;
  activeReport: ReportData | null;
  openChat: (report?: ReportData) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function GlobalChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportData | null>(null);

  const openChat = (report?: ReportData) => {
    if (report) setActiveReport(report);
    setIsOpen(true);
  };

  const closeChat = () => setIsOpen(false);

  return (
    <ChatContext.Provider value={{ isOpen, activeReport, openChat, closeChat }}>
      {children}
      <GlobalChatWidget />
    </ChatContext.Provider>
  );
}

export const useGlobalChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useGlobalChat must be used within GlobalChatProvider");
  return context;
};

// Extract plain text from a UIMessage (ai v6 format has .parts[])
function getMessageText(message: UIMessage): string {
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("");
  }
  return "";
}

function GlobalChatWidget() {
  const { isOpen, closeChat, activeReport, openChat } = useGlobalChat();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Per-report message cache: { [reportId]: messages[] }
  const historyCache = useRef<Record<string, UIMessage[]>>({});
  const prevReportId = useRef<string | undefined>(undefined);

  // Keep a ref so the transport body callback always reads the latest activeReport
  const activeReportRef = useRef<ReportData | null>(activeReport);
  activeReportRef.current = activeReport;

  const transportRef = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ reportData: activeReportRef.current || {} }),
    })
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: transportRef.current,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // When switching reports: save current messages to cache, restore history for new report
  useEffect(() => {
    const newId = activeReport?.id;

    // Save current messages under the previous report's ID
    if (prevReportId.current !== undefined) {
      historyCache.current[prevReportId.current] = messages;
    }

    // Restore messages for the new report (or start fresh)
    const cached = newId ? (historyCache.current[newId] ?? []) : [];
    setMessages(cached);

    prevReportId.current = newId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport?.id]);

  // Also keep cache in sync as messages update
  useEffect(() => {
    const id = activeReport?.id;
    if (id) {
      historyCache.current[id] = messages;
    }
  }, [messages, activeReport?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue("");
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 分享页面不展示悬浮球
  if (pathname?.startsWith("/share")) return null;

  return (
    <>
      {/* 悬浮球 */}
      {!isOpen && (
        <button
          onClick={() => openChat()}
          className="fixed bottom-8 right-8 p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all z-50 flex items-center justify-center"
          title="打开 AI 动态参谋"
        >
          <Sparkles className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </button>
      )}

      {/* 聊天面板 */}
      <div
        className={`fixed z-50 bottom-8 right-8 flex flex-col bg-white/90 backdrop-blur-2xl border border-indigo-100 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out origin-bottom-right overflow-hidden ${
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 pointer-events-none translate-y-8"
        } ${isExpanded ? "w-[80vw] h-[80vh] max-w-[800px] max-h-[800px]" : "w-[380px] h-[600px] max-h-[80vh]"}`}
      >
        {/* 头部 */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                AI 动态参谋
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9px] uppercase tracking-wider font-extrabold">Beta</span>
              </h3>
              <p className="text-[10px] text-indigo-100 mt-0.5 line-clamp-1 max-w-[180px]">
                {activeReport ? `正在关注: ${activeReport.companyName}` : "全局战略顾问模式"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors">
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={closeChat} className="p-1.5 hover:bg-white/20 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 上下文提示条 */}
        {activeReport && messages.length === 0 && (
          <div className="bg-indigo-50/50 border-b border-indigo-100/50 p-3 shrink-0 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              已将 <strong>{activeReport.companyName}</strong> 的最新情报设为上下文，可直接追问应对策略！
            </p>
          </div>
        )}

        {/* 消息区 */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/30">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100/50">
                <Bot className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-slate-600 font-bold mb-1 text-sm">战略顾问已就绪</p>
              <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed">
                点击情报卡片底部的&ldquo;向参谋追问&rdquo;可将情报注入上下文，或直接在此提问。
              </p>
            </div>
          )}

          {messages.map((m) => {
            const text = getMessageText(m);
            if (!text) return null;
            return (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm mt-1 ${m.role === "user" ? "bg-indigo-500 text-white" : "bg-white border border-slate-200 text-indigo-600"}`}>
                  {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-indigo-500 text-white rounded-tr-sm"
                    : "bg-white text-slate-700 border border-slate-200/60 rounded-tl-sm"
                }`}>
                  {m.role === "user" ? (
                    <span className="whitespace-pre-wrap">{text}</span>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        h1: ({ children }) => <h1 className="font-bold text-sm mt-3 mb-1 text-slate-800">{children}</h1>,
                        h2: ({ children }) => <h2 className="font-bold text-sm mt-3 mb-1 text-slate-800">{children}</h2>,
                        h3: ({ children }) => <h3 className="font-semibold text-xs mt-2 mb-1 text-slate-700 uppercase tracking-wide">{children}</h3>,
                        code: ({ children }) => <code className="bg-slate-100 px-1 rounded text-[11px] font-mono">{children}</code>,
                      }}
                    >
                      {text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-sm mt-1">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200/60 shadow-sm rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span className="text-[11px] text-slate-500 font-medium">思考中...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
          <div className="relative flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeReport ? `追问关于 ${activeReport.companyName} 的策略...` : "输入问题... (Enter 发送，Shift+Enter 换行)"}
              className="flex-1 pl-4 pr-3 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-2xl outline-none text-sm text-slate-700 transition-all resize-none min-h-[44px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="shrink-0 p-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-sm flex items-center justify-center h-10 w-10"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
