'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    projectsCount: 3,
    buildsCount: 6,
    artifactsCount: 5,
    mcpToolsCount: 29,
    mcpStatus: 'healthy',
  });

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-900/40 via-indigo-950/50 to-slate-900/60 border border-sky-500/20 p-8 backdrop-blur-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Universal AI Builder Platform 3.0 Live
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Autonomous Application & <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Website Studio</span>
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Prompt, generate, and compile production-grade Flutter Android apps, Native Kotlin apps, and reactive websites in seconds. Connected directly to ChatGPT and Google Gemini CLI over MCP.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/builder"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 hover:opacity-95 transition-all flex items-center gap-2"
            >
              <span>✨ Launch AI Builder</span>
            </Link>
            <Link
              href="/dashboard/builds/android"
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-200 font-semibold text-xs hover:bg-white/[0.1] transition-all flex items-center gap-2"
            >
              <span>🤖 Android Build Center</span>
            </Link>
            <Link
              href="/dashboard/mcp"
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-200 font-semibold text-xs hover:bg-white/[0.1] transition-all flex items-center gap-2"
            >
              <span>🔌 MCP Integrations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#111625]/80 border border-white/5 backdrop-blur-sm">
          <div className="text-xs font-medium text-slate-400">Total Projects</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.projectsCount} Active</div>
          <div className="text-[11px] text-sky-400 mt-2 flex items-center gap-1">
            <span>Flutter, Kotlin, React</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111625]/80 border border-white/5 backdrop-blur-sm">
          <div className="text-xs font-medium text-slate-400">Cloud Compilations</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">100% Success</div>
          <div className="text-[11px] text-slate-400 mt-2">Real APK, AAB & ZIP outputs</div>
        </div>

        <div className="p-5 rounded-xl bg-[#111625]/80 border border-white/5 backdrop-blur-sm">
          <div className="text-xs font-medium text-slate-400">MCP Server Status</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{stats.mcpToolsCount} Tools Live</div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            HTTP & SSE Transports
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#111625]/80 border border-white/5 backdrop-blur-sm">
          <div className="text-xs font-medium text-slate-400">Build Workers</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">Docker Containers</div>
          <div className="text-[11px] text-slate-400 mt-2">Flutter 3.24 / SDK 34 / Node 20</div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#111625]/70 border border-white/5 hover:border-sky-500/30 transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-lg mb-4">
              ✨
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">AI Prompt-to-App</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Describe an e-commerce platform, portfolio, or mobile utility. The engine creates all components, styles, state, and assets automatically.
            </p>
          </div>
          <Link href="/dashboard/builder" className="mt-6 text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1">
            Open Builder Workspace &rarr;
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#111625]/70 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg mb-4">
              🤖
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">Android Build Center</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Compile Flutter APKs, Flutter AABs, Native Kotlin APKs, and Google Play bundles on high-performance cloud container runners.
            </p>
          </div>
          <Link href="/dashboard/builds/android" className="mt-6 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Configure Android Builds &rarr;
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#111625]/70 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg mb-4">
              🌐
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Live Website Preview</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Test generated web applications live in an interactive sandboxed viewport simulator supporting Desktop, Tablet, and Mobile views.
            </p>
          </div>
          <Link href="/dashboard/preview" className="mt-6 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            Launch Sandbox Preview &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
