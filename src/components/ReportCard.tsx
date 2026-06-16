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
    <div className="mt-12 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 头部概览 & 公司基本面 */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-6 h-6 text-blue-400" />
              <h2 className="text-3xl font-bold tracking-tight text-white">{data.companyName}</h2>
            </div>
            <a href={data.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400/80 hover:text-blue-300 transition-colors flex items-center gap-1 w-fit">
              {data.url} <ChevronRight className="w-3 h-3" />
            </a>
            <p className="mt-6 text-lg text-zinc-300 leading-relaxed font-medium">
              {data.summary}
            </p>
          </div>
          
          {/* 公司基本面卡片 */}
          <div className="w-full md:w-72 shrink-0 bg-black/40 rounded-xl border border-zinc-800/60 p-5">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Company Profile
            </h4>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 flex items-center gap-2"><Rocket className="w-4 h-4" /> Stage</span>
                <span className="text-zinc-200 font-medium">{data.companyProfile.stage}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 flex items-center gap-2"><Users className="w-4 h-4" /> Size</span>
                <span className="text-zinc-200 font-medium">{data.companyProfile.employees}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> HQ</span>
                <span className="text-zinc-200 font-medium">{data.companyProfile.location}</span>
              </li>
              <li className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                <span className="text-zinc-500 flex items-center gap-2"><Target className="w-4 h-4" /> Market</span>
                <span className="text-zinc-200 font-medium text-right w-32 truncate">{data.companyProfile.targetMarket}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 社媒与舆情分析 */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> 社媒舆情 (Social Sentiment)
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              data.socialSentiment.overallTone === 'Mixed' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              Tone: {data.socialSentiment.overallTone} ({data.socialSentiment.score})
            </span>
          </div>
          
          <div className="mb-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Top Keywords</p>
            <div className="flex flex-wrap gap-2">
              {data.socialSentiment.keywords.map(kw => (
                <span key={kw} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-300">#{kw}</span>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-red-950/10 border border-red-900/20 rounded-xl p-4">
            <p className="text-xs text-red-400/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Risk Signals
            </p>
            <ul className="space-y-3">
              {data.socialSentiment.riskSignals.map((risk, i) => (
                <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="text-red-500/50 mt-0.5">•</span> {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 历史演变追踪 (90天) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> 历史演变追踪 (90 Days)
          </h3>
          <div className="relative border-l border-zinc-800 ml-3 space-y-6 pb-2">
            {data.historicalTimeline.map((evt, i) => (
              <div key={i} className="relative pl-6">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 ring-4 ring-zinc-950" />
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <span className="text-sm font-medium text-zinc-200">{evt.title}</span>
                  <span className="text-xs font-mono text-zinc-500 shrink-0">{evt.date}</span>
                </div>
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-indigo-400/70 bg-indigo-500/10 px-2 py-0.5 rounded">
                  {evt.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 变更细节 (Diff) */}
      <div className="rounded-2xl border border-zinc-800 bg-black p-8 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6">核心差异比对 (Website Diff)</h3>
        <div className="flex flex-col gap-6">
          {data.differences.map((diff) => (
            <div key={diff.id} className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/50">
              <div className="bg-zinc-900/80 px-5 py-3 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">{diff.category}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  diff.type === 'added' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  diff.type === 'removed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {diff.type.toUpperCase()}
                </span>
              </div>
              <div className="p-5 flex flex-col md:flex-row gap-5">
                {(diff.type === 'removed' || diff.type === 'modified') && (
                  <div className="flex-1 bg-red-950/10 border border-red-900/30 rounded-lg p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
                    <p className="text-[11px] font-mono text-red-400/80 mb-2 uppercase tracking-wider">Before</p>
                    <p className="text-sm text-red-200 line-through decoration-red-500/40 opacity-70 leading-relaxed">{diff.oldContent}</p>
                  </div>
                )}
                {(diff.type === 'added' || diff.type === 'modified') && (
                  <div className="flex-1 bg-green-950/10 border border-green-900/30 rounded-lg p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50" />
                    <p className="text-[11px] font-mono text-green-400/80 mb-2 uppercase tracking-wider">After</p>
                    <p className="text-sm text-green-100 leading-relaxed">{diff.newContent}</p>
                  </div>
                )}
              </div>
              <div className="px-5 py-4 bg-blue-950/10 border-t border-zinc-800">
                <p className="text-sm text-blue-100/80 leading-relaxed">
                  <span className="text-blue-400 font-bold mr-2">🤖 战略意图:</span>
                  {diff.reasoning}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 行动建议 */}
      <div className="relative rounded-2xl border border-blue-900/40 bg-gradient-to-br from-blue-950/30 to-black p-8 shadow-2xl overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />
        <h3 className="text-xl font-bold text-blue-100 mb-6">行动建议 (Actionable Advice)</h3>
        <div className="flex flex-col gap-4 relative z-10">
          {data.advices.map((adv) => (
            <div key={adv.id} className="flex gap-5 items-start bg-black/60 backdrop-blur-sm rounded-xl p-5 border border-blue-900/30 shadow-sm transition-all hover:bg-black/80 hover:border-blue-700/50">
              <div className={`mt-1 shrink-0 w-3 h-3 rounded-full ${
                adv.priority === 'high' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' :
                adv.priority === 'medium' ? 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.6)]' : 'bg-blue-500'
              }`} />
              <div>
                <h4 className="text-lg font-bold text-blue-50 mb-1.5">{adv.title}</h4>
                <p className="text-sm text-blue-200/80 leading-relaxed">{adv.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 情报反馈闭环 */}
      <div className="flex items-center justify-center gap-4 py-8 border-t border-zinc-800/50">
        <span className="text-sm text-zinc-500 font-medium mr-2">这份情报对你有帮助吗？</span>
        <button 
          onClick={() => setFeedback('useful')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            feedback === 'useful' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <ThumbsUp className="w-4 h-4" /> 有用
        </button>
        <button 
          onClick={() => setFeedback('wrong')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            feedback === 'wrong' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <ThumbsDown className="w-4 h-4" /> 有误
        </button>
        <button 
          onClick={() => setFeedback('not_important')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            feedback === 'not_important' ? 'bg-zinc-700 text-white border border-zinc-500' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <MessageSquareOff className="w-4 h-4" /> 不重要
        </button>
      </div>

    </div>
  );
}

