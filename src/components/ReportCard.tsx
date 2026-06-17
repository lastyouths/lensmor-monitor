"use client";

import React, { useState, useEffect } from "react";
import { ReportData } from "../app/mock_data";
import { 
  Building2, Users, Rocket, MapPin, Target,
  ThumbsUp, ThumbsDown, MessageSquareOff, ChevronRight, Globe, MessageSquare, Sparkles
} from "lucide-react";
import { useGlobalChat } from "./GlobalChat";

export function ReportCard({ data, className = "" }: { data: ReportData, className?: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const { openChat } = useGlobalChat();

  // 从后端恢复已有反馈状态
  useEffect(() => {
    if (!data.id) return;
    fetch(`/api/feedback?report_id=${data.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.type) setFeedback(d.type); })
      .catch(() => {/* 静默失败，不影响主流程 */});
  }, [data.id]);

  function handleFeedback(type: string) {
    setFeedback(type); // 乐观更新
    if (!data.id) return;
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: data.id, type }),
    }).catch(() => {/* 静默失败 */});
  }

  return (
    <div className={`flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ${className}`}>
      
      {/* 头部概览 & 公司基本面 */}
      <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Globe className="w-6 h-6 text-indigo-500" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">{data.companyName}</h2>
            </div>
            <a href={data.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 w-fit mt-1">
              {data.url} <ChevronRight className="w-3 h-3" />
            </a>
            <p className="mt-6 text-base text-slate-600 leading-relaxed font-medium">
              {data.summary}
            </p>
          </div>
          
          {/* 公司基本面卡片 */}
          <div className="w-full md:w-80 shrink-0 bg-slate-50/80 rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" /> 公司基本面
            </h4>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Rocket className="w-4 h-4" /> 阶段</span>
                <span className="text-slate-800 font-semibold">{data.companyProfile.stage}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Users className="w-4 h-4" /> 规模</span>
                <span className="text-slate-800 font-semibold">{data.companyProfile.employees}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> 总部</span>
                <span className="text-slate-800 font-semibold">{data.companyProfile.location}</span>
              </li>
              <li className="flex justify-between items-center text-sm pt-3 border-t border-slate-200/60 mt-1">
                <span className="text-slate-500 flex items-center gap-2"><Target className="w-4 h-4" /> 目标市场</span>
                <span className="text-slate-800 font-semibold text-right w-32 truncate" title={data.companyProfile.targetMarket}>
                  {data.companyProfile.targetMarket}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 变更细节 (Diff) */}
      {data.differences && data.differences.length > 0 && (
        <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <Target className="w-5 h-5" />
            </div>
            核心差异比对 (官网快照)
          </h3>
          <div className="flex flex-col gap-6">
            {data.differences.map((diff) => (
              <div key={diff.id} className="rounded-2xl border border-slate-200/60 overflow-hidden bg-white shadow-sm">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/60 flex justify-between items-center">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                    {diff.category === 'pricing' ? '定价调整' : 
                     diff.category === 'marketing' ? '市场营销' :
                     diff.category === 'feature' ? '功能更新' :
                     diff.category === 'operation' ? '运营动态' : diff.category}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    diff.type === 'added' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    diff.type === 'removed' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                    'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}>
                    {diff.type === 'added' ? '新增' : 
                     diff.type === 'removed' ? '移除' : 
                     diff.type === 'modified' ? '修改' : String(diff.type).toUpperCase()}
                  </span>
                </div>
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  {(diff.type === 'removed' || diff.type === 'modified') && (
                    <div className="flex-1 bg-rose-50/30 border border-rose-100 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                      <p className="text-[11px] font-bold font-mono text-rose-500 mb-3 uppercase tracking-wider">修改前 / 删减内容</p>
                      <p className="text-sm font-medium text-rose-900/80 line-through decoration-rose-400/50 leading-relaxed">{diff.oldContent}</p>
                    </div>
                  )}
                  {(diff.type === 'added' || diff.type === 'modified') && (
                    <div className="flex-1 bg-emerald-50/30 border border-emerald-100 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400" />
                      <p className="text-[11px] font-bold font-mono text-emerald-600 mb-3 uppercase tracking-wider">修改后 / 新增内容</p>
                      <p className="text-sm font-medium text-emerald-900/90 leading-relaxed">{diff.newContent}</p>
                    </div>
                  )}
                </div>
                <div className="px-6 py-5 bg-indigo-50/30 border-t border-slate-100">
                  <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                    <span className="text-indigo-600 font-bold mr-2">🤖 战略意图:</span>
                    {diff.reasoning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 行动建议 */}
      {data.advices && data.advices.length > 0 && (
        <div className="relative rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 p-8 shadow-[0_8px_30px_rgba(99,102,241,0.08)] overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-400/10 blur-3xl rounded-full pointer-events-none" />
          <h3 className="text-xl font-bold text-indigo-950 mb-6 flex items-center gap-2 relative z-10">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <Rocket className="w-5 h-5" />
            </div>
            行动建议 (执行层指导)
          </h3>
          <div className="flex flex-col gap-4 relative z-10">
            {data.advices.map((adv) => (
              <div key={adv.id} className="flex gap-5 items-start bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-indigo-100 shadow-sm transition-all hover:bg-white hover:border-indigo-300 hover:shadow-md">
                <div className={`mt-1 shrink-0 w-3.5 h-3.5 rounded-full ring-4 ${
                  adv.priority === 'high' ? 'bg-rose-500 ring-rose-100' :
                  adv.priority === 'medium' ? 'bg-amber-500 ring-amber-100' : 'bg-blue-500 ring-blue-100'
                }`} />
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">{adv.title}</h4>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">{adv.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速追问入口 */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-2xl border border-indigo-100/50">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            需要深度应对策略？
          </h4>
          <p className="text-xs text-slate-500 mt-1">让 AI 动态参谋结合当前快照为您出谋划策</p>
        </div>
        <button 
          onClick={() => openChat(data)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-indigo-500/25 hover:-translate-y-0.5"
        >
          <MessageSquare className="w-4 h-4" />
          向参谋追问
        </button>
      </div>

      {/* 情报反馈闭环 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 border-t border-slate-200/60 mt-4">
        <span className="text-sm text-slate-500 font-bold mr-2">这份情报对你有帮助吗？</span>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleFeedback('useful')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              feedback === 'useful' ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <ThumbsUp className="w-4 h-4" /> 有用
          </button>
          <button 
            onClick={() => handleFeedback('wrong')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              feedback === 'wrong' ? 'bg-rose-50 text-rose-600 border-2 border-rose-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <ThumbsDown className="w-4 h-4" /> 有误
          </button>
          <button 
            onClick={() => handleFeedback('not_important')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              feedback === 'not_important' ? 'bg-slate-100 text-slate-700 border-2 border-slate-300' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <MessageSquareOff className="w-4 h-4" /> 不重要
          </button>
        </div>
      </div>

    </div>
  );
}
