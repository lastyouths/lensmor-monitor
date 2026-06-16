"use client";

import React, { useState } from "react";
import { ReportData } from "../app/mock_data";
import { 
  Building2, Users, Rocket, MapPin, Target, TrendingUp, AlertTriangle, 
  ThumbsUp, ThumbsDown, MessageSquareOff, ChevronRight, Activity, Globe 
} from "lucide-react";

export function ReportCard({ data }: { data: ReportData }) {
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="mt-8 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
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
              <Building2 className="w-4 h-4 text-slate-400" /> Company Profile
            </h4>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Rocket className="w-4 h-4" /> Stage</span>
                <span className="text-slate-800 font-semibold">{data.companyProfile.stage}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Users className="w-4 h-4" /> Size</span>
                <span className="text-slate-800 font-semibold">{data.companyProfile.employees}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> HQ</span>
                <span className="text-slate-800 font-semibold">{data.companyProfile.location}</span>
              </li>
              <li className="flex justify-between items-center text-sm pt-3 border-t border-slate-200/60 mt-1">
                <span className="text-slate-500 flex items-center gap-2"><Target className="w-4 h-4" /> Market</span>
                <span className="text-slate-800 font-semibold text-right w-32 truncate" title={data.companyProfile.targetMarket}>
                  {data.companyProfile.targetMarket}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 社媒与舆情分析 */}
        <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl p-6 flex flex-col shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-lg text-purple-500">
                <Activity className="w-4 h-4" />
              </div>
              社媒舆情 (Sentiment)
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              data.socialSentiment.overallTone === 'Mixed' ? 'bg-amber-50 text-amber-600 border border-amber-200/60' : 
              data.socialSentiment.overallTone === 'Positive' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' :
              'bg-blue-50 text-blue-600 border border-blue-200/60'
            }`}>
              Tone: {data.socialSentiment.overallTone} ({data.socialSentiment.score})
            </span>
          </div>
          
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Top Keywords</p>
            <div className="flex flex-wrap gap-2">
              {data.socialSentiment.keywords.map(kw => (
                <span key={kw} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-rose-50/50 border border-rose-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Risk Signals
            </p>
            <ul className="space-y-3">
              {data.socialSentiment.riskSignals.map((risk, i) => (
                <li key={i} className="text-sm text-rose-900 flex items-start gap-2.5 font-medium leading-relaxed">
                  <span className="text-rose-400 mt-0.5 shrink-0">•</span> {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 历史演变追踪 (90天) */}
        <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-500">
              <TrendingUp className="w-4 h-4" />
            </div>
            历史演变追踪 (90 Days)
          </h3>
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-7 pb-2 mt-4">
            {data.historicalTimeline.map((evt, i) => (
              <div key={i} className="relative pl-6">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-indigo-100 shadow-sm" />
                <div className="flex flex-col gap-1.5 mb-2">
                  <span className="text-xs font-bold font-mono text-slate-400 shrink-0">{evt.date}</span>
                  <span className="text-sm font-semibold text-slate-700 leading-snug">{evt.title}</span>
                </div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100/50">
                  {evt.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 变更细节 (Diff) */}
      <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
            <Target className="w-5 h-5" />
          </div>
          核心差异比对 (Website Diff)
        </h3>
        <div className="flex flex-col gap-6">
          {data.differences.map((diff) => (
            <div key={diff.id} className="rounded-2xl border border-slate-200/60 overflow-hidden bg-white shadow-sm">
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/60 flex justify-between items-center">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">{diff.category}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  diff.type === 'added' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                  diff.type === 'removed' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                  'bg-blue-50 text-blue-600 border border-blue-200'
                }`}>
                  {diff.type.toUpperCase()}
                </span>
              </div>
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {(diff.type === 'removed' || diff.type === 'modified') && (
                  <div className="flex-1 bg-rose-50/30 border border-rose-100 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                    <p className="text-[11px] font-bold font-mono text-rose-500 mb-3 uppercase tracking-wider">Before</p>
                    <p className="text-sm font-medium text-rose-900/80 line-through decoration-rose-400/50 leading-relaxed">{diff.oldContent}</p>
                  </div>
                )}
                {(diff.type === 'added' || diff.type === 'modified') && (
                  <div className="flex-1 bg-emerald-50/30 border border-emerald-100 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400" />
                    <p className="text-[11px] font-bold font-mono text-emerald-600 mb-3 uppercase tracking-wider">After</p>
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

      {/* 行动建议 */}
      <div className="relative rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 p-8 shadow-[0_8px_30px_rgba(99,102,241,0.08)] overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-400/10 blur-3xl rounded-full pointer-events-none" />
        <h3 className="text-xl font-bold text-indigo-950 mb-6 flex items-center gap-2 relative z-10">
          <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
            <Rocket className="w-5 h-5" />
          </div>
          行动建议 (Actionable Advice)
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

      {/* 情报反馈闭环 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 border-t border-slate-200/60 mt-4">
        <span className="text-sm text-slate-500 font-bold mr-2">这份情报对你有帮助吗？</span>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFeedback('useful')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              feedback === 'useful' ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <ThumbsUp className="w-4 h-4" /> 有用
          </button>
          <button 
            onClick={() => setFeedback('wrong')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              feedback === 'wrong' ? 'bg-rose-50 text-rose-600 border-2 border-rose-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <ThumbsDown className="w-4 h-4" /> 有误
          </button>
          <button 
            onClick={() => setFeedback('not_important')}
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
