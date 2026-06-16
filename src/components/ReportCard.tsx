"use client";

import React from "react";
import { ReportData, Difference, ActionAdvice } from "../app/mock_data";

export function ReportCard({ data }: { data: ReportData }) {
  return (
    <div className="mt-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 头部概览 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white">{data.companyName} 动态报告</h2>
          <a href={data.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300">
            {data.url} ↗
          </a>
        </div>
        <p className="mt-4 text-zinc-300 leading-relaxed">{data.summary}</p>
      </div>

      {/* 变更细节 (Diff) */}
      <div className="rounded-xl border border-zinc-800 bg-black p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">核心差异比对 (Diff)</h3>
        <div className="flex flex-col gap-4">
          {data.differences.map((diff) => (
            <div key={diff.id} className="rounded-lg border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">{diff.category}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  diff.type === 'added' ? 'bg-green-500/10 text-green-400' :
                  diff.type === 'removed' ? 'bg-red-500/10 text-red-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {diff.type}
                </span>
              </div>
              <div className="p-4 flex flex-col md:flex-row gap-4">
                {(diff.type === 'removed' || diff.type === 'modified') && (
                  <div className="flex-1 bg-red-950/20 border border-red-900/30 rounded p-3">
                    <p className="text-xs font-mono text-red-400 mb-1">- Before</p>
                    <p className="text-sm text-red-200 line-through opacity-80">{diff.oldContent}</p>
                  </div>
                )}
                {(diff.type === 'added' || diff.type === 'modified') && (
                  <div className="flex-1 bg-green-950/20 border border-green-900/30 rounded p-3">
                    <p className="text-xs font-mono text-green-400 mb-1">+ After</p>
                    <p className="text-sm text-green-200">{diff.newContent}</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800">
                <p className="text-sm text-zinc-400"><span className="text-zinc-500 font-semibold mr-2">🤖 AI 解析:</span>{diff.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 行动建议 */}
      <div className="rounded-xl border border-blue-900/30 bg-blue-950/10 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-blue-100 mb-4">行动建议 (Actionable Advice)</h3>
        <div className="flex flex-col gap-3">
          {data.advices.map((adv) => (
            <div key={adv.id} className="flex gap-4 items-start bg-black/40 rounded-lg p-4 border border-blue-900/20">
              <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${
                adv.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' :
                adv.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <div>
                <h4 className="text-base font-medium text-blue-50">{adv.title}</h4>
                <p className="mt-1 text-sm text-blue-200/70">{adv.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
