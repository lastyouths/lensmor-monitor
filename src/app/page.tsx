"use client";

import { useState } from "react";
import { mockReportData, ReportData } from "./mock_data";
import { ReportCard } from "../components/ReportCard";
import { LayoutDashboard, Inbox, Settings, Plus, Search, Bell, Activity } from "lucide-react";

export default function HomePage() {
  const [url, setUrl] = useState("https://supabase.com");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [report, setReport] = useState<ReportData | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setStatus("loading");
    setReport(null);

    // 模拟等待异步队列的时间
    setTimeout(() => {
      setReport(mockReportData);
      setStatus("success");
    }, 3000);
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* 左侧边栏 - 模拟真实的竞品管理菜单 */}
      <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-lg tracking-wider">
            <Activity className="w-6 h-6" />
            LENSMOR
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1 mb-8">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600/10 text-blue-400">
              <Inbox className="w-4 h-4" />
              情报收件箱
              <span className="ml-auto bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">1 New</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              全局看板
            </button>
          </div>

          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">监控中 (3)</span>
            <button className="text-zinc-500 hover:text-zinc-300"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-800">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Supabase
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-zinc-400 hover:bg-zinc-900 transition-colors">
              <div className="w-2 h-2 rounded-full bg-zinc-600" />
              Vercel
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-zinc-400 hover:bg-zinc-900 transition-colors">
              <div className="w-2 h-2 rounded-full bg-zinc-600" />
              Stripe
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-800">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-400 hover:bg-zinc-900 transition-colors">
            <Settings className="w-4 h-4" />
            设置
          </button>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* 顶部导航 */}
        <header className="h-16 shrink-0 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <h1 className="text-lg font-semibold text-zinc-200">情报收件箱 (Inbox)</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="在报告中搜索..." 
                className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-sm focus:outline-none focus:border-zinc-600 text-zinc-300 w-64"
              />
            </div>
            <button className="relative text-zinc-400 hover:text-zinc-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-zinc-950" />
            </button>
          </div>
        </header>

        {/* 内容滚动区 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            
            {/* POC 专属：手动触发监控区块 */}
            <div className="mb-10 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" /> 
                单次强制刷新采集 (POC Demo)
              </h3>
              <form onSubmit={handleAnalyze} className="relative flex items-center">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="输入竞品网站 URL，如 https://supabase.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                  disabled={status === "loading"}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="absolute right-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "任务排队中..." : "开始采集与分析"}
                </button>
              </form>
            </div>

            {status === "idle" && (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Inbox className="w-12 h-12 mb-4 opacity-20" />
                <p>收件箱已清空。请在上方输入 URL 触发一次新的采集任务。</p>
              </div>
            )}

            {status === "loading" && (
              <div className="py-20 flex flex-col items-center justify-center gap-5 text-zinc-400 animate-pulse">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-zinc-800 border-t-blue-500 animate-spin" />
                  <Activity className="w-6 h-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-zinc-300">后台异步队列正在处理...</p>
                  <p className="text-sm">Jina Reader 提取页网快照 / LLM 差异比对中 / 生成建议中</p>
                </div>
              </div>
            )}

            {status === "success" && report && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> 
                    刚刚到达的新情报
                  </h2>
                  <span className="text-xs font-mono text-zinc-500">Just now</span>
                </div>
                {/* 这里的 ReportCard 就是我们上一步做的高颜值卡片 */}
                <ReportCard data={report} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
