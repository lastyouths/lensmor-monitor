"use client";

import React, { useState } from "react";
import { ReportCard } from "./ReportCard";
import { History, ChevronDown, ChevronRight } from "lucide-react";

export function CompanyTimelineView({ reports, onMarkRead }: { reports: any[], onMarkRead: (id: string) => void }) {
  const latest = reports[0];
  const [expandedId, setExpandedId] = useState<string | null>(latest?.id || null);

  // 初始化时，如果最新的一条是未读的，且默认展开了，就自动标记为已读
  React.useEffect(() => {
    if (latest && !latest.is_read && expandedId === latest.id) {
      onMarkRead(latest.id);
    }
  }, [latest, expandedId, onMarkRead]);

  const handleExpand = (reportId: string, isCurrentlyExpanded: boolean, isRead: boolean) => {
    if (!isCurrentlyExpanded) {
      setExpandedId(reportId);
      if (!isRead) {
        onMarkRead(reportId);
      }
    } else {
      setExpandedId(null);
    }
  };

  if (!latest) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/50">
        <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
            <History className="w-6 h-6" />
          </div>
          {latest.company_name} - 监控时间轴
        </h2>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-bold tracking-wider uppercase text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50">
            {reports.length} Records
          </span>
        </div>
      </div>

      <div className="relative border-l-[3px] border-indigo-100 ml-5 space-y-8 pb-4 mt-2">
        {reports.map((report, index) => {
          const isExpanded = expandedId === report.id;
          const dateStr = new Date(report.created_at).toLocaleString('zh-CN', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          });

          return (
            <div key={report.id} className="relative pl-8">
              {/* Timeline dot */}
              <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 shadow-sm transition-all duration-300 ${
                index === 0 ? 'bg-indigo-500 border-indigo-100 ring-4 ring-indigo-50/80 scale-110' : 'bg-white border-slate-300'
              }`} />
              
              {/* Timeline Card */}
              <div className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                isExpanded ? 'border-indigo-200 bg-white/70 shadow-lg' : 'border-slate-200/60 bg-white/40 hover:bg-white/80 cursor-pointer shadow-sm hover:shadow-md hover:border-indigo-100'
              }`}>
                <div 
                  className="p-5 flex items-center justify-between"
                  onClick={() => handleExpand(report.id, isExpanded, report.is_read)}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold font-mono px-3 py-1.5 rounded-lg border ${
                      index === 0 ? 'text-indigo-600 bg-indigo-50 border-indigo-100/50' : 'text-slate-500 bg-slate-50 border-slate-200/50'
                    }`}>
                      {dateStr}
                    </span>
                    <span className={`text-base font-semibold ${index === 0 ? 'text-slate-800' : 'text-slate-600'} line-clamp-1 max-w-md flex items-center gap-2`}>
                      {index === 0 ? '✨ 最新情报快照' : '历史情报快照'}
                      {!report.is_read && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-rose-200 animate-pulse">
                          New
                        </span>
                      )}
                    </span>
                  </div>
                  <div className={`text-slate-400 p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-500' : 'group-hover:text-indigo-400'}`}>
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-1 sm:px-6 pb-6 border-t border-slate-100/50 pt-4 bg-white/30 backdrop-blur-md">
                    {/* 我们把数据库下划线字段映射回 ReportCard 认识的驼峰字段 */}
                    <ReportCard data={{
                      companyName: report.company_name,
                      url: report.url,
                      summary: report.summary,
                      companyProfile: report.company_profile,
                      socialSentiment: report.social_sentiment,
                      historicalTimeline: report.historical_timeline,
                      differences: report.differences,
                      advices: report.advices
                    }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
