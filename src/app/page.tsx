"use client";

import { useState, useEffect, useRef } from "react";
import { CompanyTimelineView, type ReportRow } from "../components/CompanyTimelineView";
import { LayoutDashboard, Inbox, Settings, Plus, Search, Bell, Activity, Clock, Play, Pause, RefreshCw, X, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "../utils/supabase/client";

export default function HomePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [runningTargetId, setRunningTargetId] = useState<string | null>(null);
  
  // 设置弹层
  const [showSettings, setShowSettings] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  // 点击弹层外部关闭
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    if (showSettings) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  
  type MonitorTarget = {
    id: string;
    url: string;
    name: string;
    status: string;
    frequency: string;
    unread_count: number;
    last_run_at?: string;
  };

  // Data states
  const [targets, setTargets] = useState<MonitorTarget[]>([]);
  const [activeTarget, setActiveTarget] = useState<MonitorTarget | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);

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

    let pollCount = 0;
    const MAX_POLLS = 60; // 最多轮询 60 次 × 2s = 120 秒，超时自动报错

    const pollTask = async () => {
      if (!taskId) return;
      pollCount++;
      if (pollCount > MAX_POLLS) {
        toast.error("❌ 分析超时", { description: "云端任务超过 2 分钟未响应，请重试。", duration: 8000 });
        setStatus("idle");
        setTaskId(null);
        setRunningTargetId(null);
        if (intervalId) clearInterval(intervalId);
        return;
      }
      try {
        const res = await fetch(`/api/analyze?taskId=${taskId}`);
        if (!res.ok) {
          // 404 说明 serverless 实例已重置，任务丢失，视为超时
          if (res.status === 404 && pollCount > 5) {
            toast.error("❌ 任务丢失", { description: "云端任务状态丢失，请重新提交分析。", duration: 8000 });
            setStatus("idle");
            setTaskId(null);
            setRunningTargetId(null);
            if (intervalId) clearInterval(intervalId);
          }
          return;
        }
        const data = await res.json();
        
        if (data.status === "completed") {
          await fetchTargets();
          if (activeTarget && activeTarget.id === runningTargetId) {
            await fetchReportsForTarget(activeTarget.url);
          } else if (activeTarget && activeTarget.id !== runningTargetId) {
            // 如果完成了，但当前查看的不是正在跑的任务，可以默默刷新当前查看的任务（通常不需要，但保持安全）
          }

          // BUG-03 fix: 未登录时给出明确提示，避免误导
          if (data.requiresLogin) {
            toast.warning("⚠️ 分析完成，但报告未保存", {
              description: "游客模式下报告不会持久化，请登录后再重新分析以保存结果。",
              duration: 8000,
            });
          } else if (data.data?.differences && data.data.differences.length > 0) {
            toast.success(`🎉 分析完成！发现 ${data.data.differences.length} 处实质性差异。`, {
              description: `来自任务: ${data.data.companyName || '未知公司'}`,
              duration: 5000,
            });
          } else {
            toast.info("✅ 分析完成，未发现实质性变动。");
          }

          setStatus("success");
          setTaskId(null);
          setRunningTargetId(null);
        } else if (data.status === "error") {
          toast.error("❌ 分析任务执行失败", {
            description: data.error || "未知错误",
            duration: 8000,
          });
          setStatus("idle");
          setTaskId(null);
          setRunningTargetId(null);
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
  }, [taskId, status, activeTarget, runningTargetId]);

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

  const handleUpdateTarget = async (id: string, updates: Partial<MonitorTarget>) => {
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
      // 乐观更新：立刻在本地扣减未读数量，实现秒级 UI 响应
      if (activeTarget) {
        setTargets(prev => prev.map(t => 
          t.id === activeTarget.id 
            ? { ...t, unread_count: Math.max(0, (t.unread_count || 0) - 1) }
            : t
        ));
      }

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, is_read: true } : r));

      // 异步同步到后端
      fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, is_read: true })
      }).then(() => {
        // 后台再静默刷新一次确保多端一致性
        fetchTargets();
      });
    } catch (e) {
      console.error(e);
    }
  };
  const handleForceRun = async () => {
    if (!activeTarget) return;
    setStatus("loading");
    setTaskId(null);
    setRunningTargetId(activeTarget.id);

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
                        {t.unread_count} 未读
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
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(v => !v)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-slate-500 hover:bg-white/60 hover:text-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              设置
            </button>

            {showSettings && (
              <div className="absolute bottom-full mb-2 left-0 w-64 bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">当前账号</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{userEmail ?? "加载中..."}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航 */}
        <header className="h-16 shrink-0 border-b border-white/50 bg-white/40 backdrop-blur-xl flex items-center justify-between px-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h1 className="text-lg font-bold text-slate-800">
            {activeTarget ? '监控任务详情' : '全局看板'}
          </h1>
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setShowNewTargetModal(true)}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新建监控</span>
            </button>
            <div className="relative hidden md:block">
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
              targets.length === 0 ? (
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
                  <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                      <LayoutDashboard className="w-6 h-6 text-indigo-500" />
                      大盘总览
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/50 border border-slate-100 p-5 rounded-xl">
                        <p className="text-sm font-semibold text-slate-500 mb-2">监控任务总数</p>
                        <p className="text-3xl font-extrabold text-slate-800">{targets.length}</p>
                      </div>
                      <div className="bg-white/50 border border-slate-100 p-5 rounded-xl">
                        <p className="text-sm font-semibold text-slate-500 mb-2">未读新情报</p>
                        <p className="text-3xl font-extrabold text-rose-500">{targets.reduce((acc, t) => acc + (t.unread_count || 0), 0)}</p>
                      </div>
                      <div className="bg-white/50 border border-slate-100 p-5 rounded-xl">
                        <p className="text-sm font-semibold text-slate-500 mb-2">活跃任务数</p>
                        <p className="text-3xl font-extrabold text-emerald-500">{targets.filter(t => t.status === 'active').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {targets.map(t => (
                      <div key={t.id} onClick={() => setActiveTarget(t)} className="bg-white/40 hover:bg-white/70 backdrop-blur-xl border border-white shadow-sm hover:shadow-md cursor-pointer rounded-2xl p-5 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-slate-800 truncate">{t.name}</h3>
                          {t.unread_count > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t.unread_count} 未读</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate mb-4">{t.url}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> 
                            {t.frequency === 'daily' ? '每天' : t.frequency === 'weekly' ? '每周' : '手动'}
                          </span>
                          <span className={`flex items-center gap-1 ${t.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {t.status === 'active' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />} 
                            {t.status === 'active' ? '监控中' : '已暂停'}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* 添加新任务的快捷卡片 */}
                    <button 
                      onClick={() => setShowNewTargetModal(true)}
                      className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-2xl p-5 transition-all text-slate-500 hover:text-indigo-600 h-full min-h-[140px]"
                    >
                      <div className="p-3 bg-white rounded-full shadow-sm">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-sm">添加新监控任务</span>
                    </button>
                  </div>
                </div>
              )
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
                        {activeTarget.status === 'active' ? '监控中' : '已暂停'}
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
                        <option value="daily">每天抓取一次</option>
                        <option value="weekly">每周抓取一次</option>
                        <option value="manual">仅手动触发</option>
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
                      <RefreshCw className={`w-4 h-4 ${status === 'loading' && runningTargetId === activeTarget.id ? 'animate-spin' : ''}`} />
                      {status === "loading" 
                        ? (runningTargetId === activeTarget.id ? "采集分析中..." : "等待其他任务...") 
                        : "强制刷新采集"}
                    </button>
                  </div>
                </div>

                {/* 状态反馈 */}
                {status === "loading" && runningTargetId === activeTarget.id && (
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
                ) : status === "loading" && runningTargetId === activeTarget.id ? null : (
                  <div className="py-20 text-center border border-dashed border-slate-300 rounded-2xl bg-white/20">
                    <p className="text-slate-500 font-medium">该任务还没有采集记录。</p>
                    <p className="text-sm text-slate-400 mt-1">点击上方的“强制刷新采集”按钮进行首次抓取。</p>
                  </div>
                )}

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
