import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/50 to-purple-200/50 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[40%] h-[60%] rounded-full bg-gradient-to-bl from-blue-200/50 to-cyan-200/50 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Lensmor Monitor</h1>
          <p className="text-sm text-slate-500 mt-2">Sign in to your account</p>
        </div>

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="px-4 py-2.5 rounded-xl border border-slate-200/60 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="px-4 py-2.5 rounded-xl border border-slate-200/60 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>

          {resolvedParams?.message && (
            <div className="p-3 mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl text-center">
              {resolvedParams.message}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4">
            <button
              formAction={login}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              Sign In
            </button>
            <button
              formAction={signup}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-sm border border-slate-200 transition-all"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
