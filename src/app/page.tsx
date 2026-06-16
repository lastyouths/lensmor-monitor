"use client";

import { useState } from "react";
import { mockReportData, ReportData } from "./mock_data";
import { ReportCard } from "../components/ReportCard";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [report, setReport] = useState<ReportData | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setStatus("loading");
    setReport(null);

    // 模拟等待 3 秒的异步队列体验
    setTimeout(() => {
      setReport(mockReportData);
      setStatus("success");
    }, 3000);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
      <div className="flex flex-col items-center text-center">
        <p className="text-sm font-mono tracking-widest text-zinc-500 mb-4">LENSMOR MONITOR</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          竞品情报自动追踪
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">
          输入竞争对手网站，AI 将自动分析页面历史变化，提炼战略意图，并为您生成高价值的行动建议清单。
        </p>
      </div>

      <div className="mt-10 w-full max-w-2xl mx-auto">
        <form onSubmit={handleAnalyze} className="relative flex items-center">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入竞品网站 URL，如 https://supabase.com"
            className="w-full rounded-full border border-zinc-700 bg-zinc-900/80 px-6 py-4 text-base text-white placeholder-zinc-500 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            required
            disabled={status === "loading"}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="absolute right-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                分析中...
              </span>
            ) : "开始监控"}
          </button>
        </form>
      </div>

      {status === "loading" && (
        <div className="mt-16 flex flex-col items-center justify-center gap-4 text-zinc-500 animate-pulse">
          <div className="h-12 w-12 rounded-full border-4 border-zinc-800 border-t-blue-500 animate-spin" />
          <p>正在拉取网站内容与历史快照...</p>
        </div>
      )}

      {status === "success" && report && (
        <ReportCard data={report} />
      )}
    </main>
  );
}
