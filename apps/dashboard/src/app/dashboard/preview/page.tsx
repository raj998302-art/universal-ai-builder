'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function WebsitePreviewContent() {
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState<string>(searchParams.get('id') || 'proj_dopYf3iSTFBL');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState<number>(1);

  const previewUrl = `/api/preview/${projectId}`;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Interactive Sandbox</div>
          <h1 className="text-2xl font-black text-white mt-1">Live Website Preview Studio</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time interactive rendering of generated HTML/React applications.
          </p>
        </div>

        {/* Viewport & Controls */}
        <div className="flex items-center gap-3">
          <div className="bg-[#111625] border border-white/10 rounded-xl p-1 flex items-center gap-1">
            <button
              onClick={() => setViewport('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewport === 'desktop' ? 'bg-sky-500 text-slate-900 shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              🖥️ Desktop
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewport === 'tablet' ? 'bg-sky-500 text-slate-900 shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              📱 Tablet (768px)
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewport === 'mobile' ? 'bg-sky-500 text-slate-900 shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              📲 Mobile (390px)
            </button>
          </div>

          <button
            onClick={() => setKey(prev => prev + 1)}
            className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-200 text-xs font-semibold hover:bg-white/[0.1] transition-all"
            title="Reload Frame"
          >
            🔄 Refresh
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold hover:bg-sky-500/30 transition-all"
          >
            ↗ Open External
          </a>
        </div>
      </div>

      {/* Project Switcher Bar */}
      <div className="flex items-center gap-3 bg-[#111625]/60 border border-white/5 rounded-xl p-3">
        <span className="text-xs font-semibold text-slate-400">Target Project ID:</span>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="proj_..."
          className="bg-[#090d16] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-sky-400 font-mono focus:outline-none focus:border-sky-500 w-64"
        />
        <span className="text-[11px] text-slate-500">Live endpoint: {previewUrl}</span>
      </div>

      {/* Simulator Device Frame */}
      <div className="flex justify-center bg-[#070a10] border border-white/5 rounded-2xl p-6 min-h-[700px] overflow-hidden">
        <div
          className={`transition-all duration-300 bg-[#090d16] rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col ${
            viewport === 'desktop'
              ? 'w-full h-[650px]'
              : viewport === 'tablet'
              ? 'w-[768px] h-[650px]'
              : 'w-[390px] h-[650px]'
          }`}
        >
          {/* Simulated Browser Bar */}
          <div className="bg-[#161e31] px-4 py-2 border-b border-white/5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="flex-1 bg-[#090d16] rounded px-3 py-1 text-[11px] text-slate-400 font-mono text-center truncate mx-4 border border-white/5">
              https://preview.universal-ai-builder.dev/{projectId}
            </div>
          </div>

          {/* Rendered Frame */}
          <iframe
            key={key}
            src={previewUrl}
            title="Website Live Preview"
            className="w-full flex-1 border-none bg-white"
            sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

export default function WebsitePreviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading Website Preview...</div>}>
      <WebsitePreviewContent />
    </Suspense>
  );
}
