import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ReportCard } from "../../../components/ReportCard";
import { ShieldCheck, CalendarClock } from "lucide-react";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // 既然数据库的 RLS 已经被干掉，我们可以直接用普通匿名客户端拉取数据，完美实现游客访问！
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();
    
  if (error || !report) {
    notFound();
  }

  const dateStr = new Date(report.created_at).toLocaleString('zh-CN', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 relative selection:bg-indigo-100 selection:text-indigo-900">
      {/* 背景点缀 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* 顶部标识 */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              公开情报快照
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4" /> 生成于: {dateStr}
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-center sm:text-right">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">
              Powered by
            </span>
            <span className="font-extrabold text-indigo-800 tracking-wider">
              LENSMOR AI
            </span>
          </div>
        </header>

        {/* 报告卡片 */}
        <ReportCard data={{
          id: report.id,
          companyName: report.company_name,
          url: report.url,
          summary: report.summary,
          companyProfile: report.company_profile,
          differences: report.differences,
          advices: report.advices
        }} />
        
        <footer className="mt-12 text-center text-sm font-medium text-slate-400">
          此情报由 Lensmor Monitor 自动抓取分析并生成。
        </footer>
      </div>
    </div>
  );
}
