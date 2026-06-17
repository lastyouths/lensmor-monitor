export default function ShareNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">情报不存在或已失效</h2>
        <p className="text-slate-500">你访问的分享链接可能不正确或已过期。</p>
      </div>
    </div>
  );
}
