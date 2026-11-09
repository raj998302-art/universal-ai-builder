'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'integrations' | 'account' | 'notifications'>('integrations');

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure cloud infrastructure providers, database persistence, and external AI agents.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/5 pb-3">
        {(['integrations', 'account', 'notifications'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GitHub Actions Runner Integration */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🐙</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">GitHub Cloud Workers</h3>
                  <p className="text-xs text-slate-400">Actions Orchestration Engine</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatches workflow dispatch events to <code className="text-sky-300">build-worker.yml</code> for Flutter, Native Android APK/AAB, and Web distributions.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-black/40 p-2.5 rounded-lg border border-white/5">
              Repo: raj998302-art/universal-ai-builder (Branch: main)
            </div>
          </div>

          {/* Vercel Serverless Hosting */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">▲</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">Vercel Serverless</h3>
                  <p className="text-xs text-slate-400">Control Plane & MCP Gateway</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hosts the Next.js Dashboard, Streamable HTTP MCP server, and live device preview iframe sandboxes.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-black/40 p-2.5 rounded-lg border border-white/5">
              Target: universal-ai-builder-nine.vercel.app
            </div>
          </div>

          {/* Neon Database Persistence */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🐘</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">Neon PostgreSQL</h3>
                  <p className="text-xs text-slate-400">Multi-Tier Data Store</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Storage Synced
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provides cold-start resilient persistence backed by multi-tier storage (In-memory + GitHub repository sync + PostgreSQL).
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-black/40 p-2.5 rounded-lg border border-white/5">
              Sync Mode: GitHub Persistent Data Tree + Memory
            </div>
          </div>

          {/* Cloudflare R2 / S3 Storage */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">Cloudflare R2 / S3</h3>
                  <p className="text-xs text-slate-400">Artifact Distribution Storage</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Hybrid Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Serves compiled release APKs, AAB bundles, and website ZIPs directly via signed GitHub workflow artifact endpoints and CDN streams.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-black/40 p-2.5 rounded-lg border border-white/5">
              Distribution: Signed GitHub Runner Storage + Direct CDN
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6 max-w-xl">
          <h3 className="text-base font-semibold text-white">Platform Administrator Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Administrator Email</label>
              <input
                type="email"
                value="admin@universal-ai-builder.internal"
                readOnly
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-slate-300 select-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Organization ID</label>
              <input
                type="text"
                value="org_uab_enterprise_01"
                readOnly
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-slate-300 select-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Active Plan</label>
              <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-sky-300">Universal Enterprise Tier</div>
                  <div className="text-[11px] text-slate-400">Unlimited Android APK/AAB Builds & MCP Invocations</div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500 text-black">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 max-w-xl">
          <h3 className="text-base font-semibold text-white">Build Notifications</h3>
          <p className="text-xs text-slate-400">
            Configure automated alerts when Android APK/AAB builds complete or fail in cloud runners.
          </p>
          <div className="space-y-3 pt-2">
            {[
              { label: 'Notify on successful APK/AAB builds', desc: 'Sends webhook ping when artifacts are generated', checked: true },
              { label: 'Notify on build compilation errors', desc: 'Includes diagnostic logs and AI suggested fixes', checked: true },
              { label: 'MCP connection audit logs', desc: 'Track external agent calls from ChatGPT & Gemini CLI', checked: true },
            ].map((pref, i) => (
              <label key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-black/30 border border-white/5 cursor-pointer">
                <input type="checkbox" defaultChecked={pref.checked} className="mt-1 accent-sky-500 rounded" />
                <div>
                  <div className="text-xs font-semibold text-white">{pref.label}</div>
                  <div className="text-[11px] text-slate-400">{pref.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
