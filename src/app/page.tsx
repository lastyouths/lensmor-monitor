"use client";

import { useState, useEffect, useMemo } from "react";
import { CompanyTimelineView } from "../components/CompanyTimelineView";
import { LayoutDashboard, Inbox, Settings, Plus, Search, Bell, Activity, Clock, Play, Pause, RefreshCw, X } from "lucide-react";

export default function HomePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  
  // Data states
  const [targets, setTargets] = useState<any[]>([]);
  const [activeTarget, setActiveTarget] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);

  // Modal states
  const [showNewTargetModal, setShowNewTargetModal] = useState(false);
  const [newTargetUrl, setNewTargetUrl] = useState("");

  const fetchTargets = async () => {
    try {
      const res = await fetch("/api/targets");
      if (res.ok) {
        const data = await res.json();
        setTargets(data.targets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReportsForTarget = async (url: string) => {
    try {
      const res = await fetch(`/api/reports?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  useEffect(() => {
    if (activeTarget) {
      fetchReportsForTarget(activeTarget.url);
    } else {
      setReports([]);
    }
  }, [activeTarget]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollTask = async () => {
      if (!taskId) return;
      try {
        const res = await fetch(`/api/analyze?taskId=${taskId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.status === "completed") {
          await fetchTargets();
          if (activeTarget) {
            await fetchReportsForTarget(activeTarget.url);
          }
          setStatus("success");
          setTaskId(null);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    if (taskId && status === "loading") {
      pollTask();
      intervalId = setInterval(pollTask, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId, status, activeTarget]);

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetUrl) return;
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newTargetUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchTargets();
        setActiveTarget(data.target);
        setShowNewTargetModal(false);
        setNewTargetUrl("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTarget = async (id: string, updates: any) => {
    try {
      const res = await fetch("/api/targets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        const data = await res.json();
        setTargets(prev => prev.map(t => t.id === id ? data.target : t));
        if (activeTarget?.id === id) {
          setActiveTarget(data.target);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (reportId: string) => {
    try {
      await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, is_read: true })
      });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, is_read: true } : r));
      fetchTargets(); // 刷新侧边栏的新消息计数
    } catch (e) {
      console.error(e);
    }
  };
  const handleForceRun = async () => {
    if (!activeTarget) return;
    setStatus("loading");
    setTaskId(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: activeTarget.url }),
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
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900 relative">
      {/* 动态唯美光晕背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-gradient-to-bl from-blue-200/40 to-cyan-200/40 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-gradient-to-tr from-rose-200/30 to-orange-200/30 blur-[100px]" />
      </div>

      {/* 左侧边栏 */}
      <aside className="relative z-10 w-64 shrink-0 border-r border-white/50 bg-white/40 backdrop-blur-xl flex flex-col hidden md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-16 flex items-center px-6 border-b border-white/50">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg tracking-wider">
            <Activity className="w-6 h-6" />
            LENSMOR
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1 mb-8">
            <button 
              onClick={() => setActiveTarget(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-colors ${!activeTarget ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50' : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'}`}
            >
              <Inbox className="w-4 h-4" />
              全局看板
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between px-2 mt-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">监控任务 ({targets.length})</span>
            <button 
              onClick={() => setShowNewTargetModal(true)}
              className="text-slate-400 hover:text-indigo-500 transition-colors p-1 hover:bg-white rounded-md"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            {targets.map((t) => {
              const isActive = activeTarget?.id === t.id;
              const isPaused = t.status === 'paused';
              return (
                <button 
                  key={t.id} 
                  onClick={() => setActiveTarget(t)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all border ${
                    isActive 
                      ? 'bg-white/80 text-indigo-700 border-indigo-200 shadow-sm ring-2 ring-indigo-50' 
                      : 'bg-transparent text-slate-500 hover:bg-white/60 border-transparent hover:border-white'
                  } ${isPaused ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive && !isPaused ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : isPaused ? 'bg-slate-300' : 'bg-emerald-400'}`} />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {t.unread_count > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border bg-rose-500 text-white border-rose-600">
                        {t.unread_count} New
                      </span>
                    )}
                    {isPaused && <Pause className="w-3 h-3 text-slate-400" />}
                  </div>
                </button>
              );
            })}
            {targets.length === 0 && (
              <div className="text-xs text-slate-400 px-3 py-2">暂无监控任务，请点击 + 添加</div>
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
          <h1 className="text-lg font-bold text-slate-800">
            {activeTarget ? '监控任务详情' : '全局看板 (Overview)'}
          </h1>
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
            </button>
          </div>
        </header>

        {/* 内容滚动区 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            
            {!activeTarget ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white">
                  <LayoutDashboard className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-500 mb-4">欢迎来到 Lensmor Monitor。</p>
                <button 
                  onClick={() => setShowNewTargetModal(true)}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> 添加第一个监控任务
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 任务控制面板 Sticky Header */}
                <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      {activeTarget.name}
                      <span className={`text-[10px] px-2.5 py-1 rounded-md border font-bold uppercase tracking-wider ${
                        activeTarget.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {activeTarget.status}
                      </span>
                    </h2>
                    <a href={activeTarget.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-500 hover:underline mt-1 inline-block">
                      {activeTarget.url}
                    </a>
                    {activeTarget.last_run_at && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 上次采集: {new Date(activeTarget.last_run_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* 频率选择 */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <select 
                        value={activeTarget.frequency}
                        onChange={(e) => handleUpdateTarget(activeTarget.id, { frequency: e.target.value })}
                        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="daily">每天抓取一次 (Daily)</option>
                        <option value="weekly">每周抓取一次 (Weekly)</option>
                        <option value="manual">仅手动触发 (Manual)</option>
                      </select>
                    </div>

                    {/* 状态控制 */}
                    <button
                      onClick={() => handleUpdateTarget(activeTarget.id, { status: activeTarget.status === 'active' ? 'paused' : 'active' })}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                      title={activeTarget.status === 'active' ? '暂停监控' : '恢复监控'}
                    >
                      {activeTarget.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* 手动即时触发 */}
                    <button
                      onClick={handleForceRun}
                      disabled={status === "loading"}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
                      {status === "loading" ? "采集分析中..." : "强制刷新采集"}
                    </button>
                  </div>
                </div>

                {/* 状态反馈 */}
                {status === "loading" && (
                  <div className="py-12 flex flex-col items-center justify-center gap-6 animate-pulse bg-white/40 rounded-2xl border border-white">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin shadow-lg" />
                      <Activity className="w-5 h-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-bold text-slate-700">正在执行云端调度...</p>
                      <p className="text-xs font-medium text-slate-500">提取最新快照并比对历史数据</p>
                    </div>
                  </div>
                )}

                {/* 时间轴视图 */}
                {reports.length > 0 ? (
                  <CompanyTimelineView reports={reports} onMarkRead={handleMarkRead} />
                ) : status !== "loading" ? (
                  <div className="py-20 text-center border border-dashed border-slate-300 rounded-2xl bg-white/20">
                    <p className="text-slate-500 font-medium">该任务还没有采集记录。</p>
                    <p className="text-sm text-slate-400 mt-1">点击上方的“强制刷新采集”按钮进行首次抓取。</p>
                  </div>
                ) : null}

              </div>
            )}
            
          </div>
        </div>
      </main>

      {/* 新建任务 Modal */}
      {showNewTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">新建监控任务</h3>
              <button onClick={() => setShowNewTargetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTarget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">目标 URL</label>
                <input
                  type="url"
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">创建后，系统将按照设定的频率自动抓取并分析该页面的变化。</p>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowNewTargetModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 shadow-sm"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
