"use client";

import { useState, useEffect } from "react";
import { ReportData } from "./mock_data";
import { ReportCard } from "../components/ReportCard";
import { LayoutDashboard, Inbox, Settings, Plus, Search, Bell, Activity } from "lucide-react";

export default function HomePage() {
  const [url, setUrl] = useState("https://supabase.com");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [report, setReport] = useState<ReportData | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollTask = async () => {
      if (!taskId) return;
      try {
        const res = await fetch(`/api/analyze?taskId=${taskId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.status === "completed") {
          setReport(data.data);
          setStatus("success");
          setTaskId(null); // 停止轮询
          fetchHistory(); // 刷新历史记录
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    if (taskId && status === "loading") {
      // 立即查一次
      pollTask();
      // 然后每 2 秒轮询一次
      intervalId = setInterval(pollTask, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId, status]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setStatus("loading");
    setReport(null);
    setTaskId(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.taskId) {
        setTaskId(data.taskId);
      } else {
        setStatus("idle");
        alert("Failed to start analysis task");
      }
    } catch (err) {
      console.error(err);
      setStatus("idle");
      alert("Failed to start analysis task");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* 动态唯美光晕背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-gradient-to-bl from-blue-200/40 to-cyan-200/40 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-rose-200/30 to-orange-200/30 blur-[100px]" />
      </div>

      {/* 左侧边栏 - 毛玻璃设计 */}
      <aside className="relative z-10 w-64 shrink-0 border-r border-white/50 bg-white/40 backdrop-blur-xl flex flex-col hidden md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-16 flex items-center px-6 border-b border-white/50">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg tracking-wider">
            <Activity className="w-6 h-6" />
            LENSMOR
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1 mb-8">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50">
              <Inbox className="w-4 h-4" />
              情报收件箱
              <span className="ml-auto bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">1 New</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-slate-500 hover:bg-white/60 hover:text-slate-800 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              全局看板
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between px-2 mt-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">历史情报 ({history.length})</span>
            <button className="text-slate-400 hover:text-indigo-500 transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1">
            {history.map((h) => (
              <button key={h.id} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-slate-500 hover:bg-white/40 transition-colors truncate">
                <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                <span className="truncate">{h.company_name}</span>
              </button>
            ))}
            {history.length === 0 && (
              <div className="text-xs text-slate-400 px-3 py-2">暂无历史记录</div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-white/50">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-slate-500 hover:bg-white/60 hover:text-slate-800 transition-colors">
            <Settings className="w-4 h-4" />
            设置
          </button>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航 */}
        <header className="h-16 shrink-0 border-b border-white/50 bg-white/40 backdrop-blur-xl flex items-center justify-between px-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h1 className="text-lg font-bold text-slate-800">情报收件箱 (Inbox)</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="在报告中搜索..." 
                className="pl-9 pr-4 py-2 bg-white/50 border border-white/60 rounded-full text-sm font-medium focus:outline-none focus:border-indigo-300 focus:bg-white text-slate-700 w-64 shadow-sm transition-all placeholder-slate-400"
              />
            </div>
            <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-white/50 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* 内容滚动区 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            
            {/* POC 专属：手动触发监控区块 */}
            <div className="mb-10 bg-white/60 backdrop-blur-md border border-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                  <Plus className="w-4 h-4" /> 
                </div>
                单次强制刷新采集 (POC Demo)
              </h3>
              <form onSubmit={handleAnalyze} className="relative flex items-center">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="输入竞品网站 URL，如 https://supabase.com"
                  className="w-full rounded-xl border border-slate-200/60 bg-white/80 px-5 py-4 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  required
                  disabled={status === "loading"}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="absolute right-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {status === "loading" ? "任务排队中..." : "开始采集与分析"}
                </button>
              </form>
            </div>

            {status === "idle" && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white">
                  <Inbox className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-500">收件箱已清空。请在上方输入 URL 触发一次新的采集任务。</p>
              </div>
            )}

            {status === "loading" && (
              <div className="py-24 flex flex-col items-center justify-center gap-6 animate-pulse">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin shadow-lg" />
                  <Activity className="w-6 h-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-bold text-slate-700 text-lg">后台异步队列正在处理...</p>
                  <p className="text-sm font-medium text-slate-500">Jina Reader 提取网页快照 / LLM 差异比对中 / 生成建议中</p>
                </div>
              </div>
            )}

            {status === "success" && report && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-8 duration-700">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                    </span>
                    刚刚到达的新情报
                  </h2>
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-400 bg-white/60 px-3 py-1 rounded-full border border-white">Just now</span>
                </div>
                <ReportCard data={report} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

