'use client';

import { useState, useEffect } from 'react';

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer uab_demo_key',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'list_artifacts', arguments: { project_id: 'all' } },
      }),
    })
      .then(res => res.json())
      .then(data => {
        let arts = data.result;
        if (arts?.content?.[0]?.text) arts = JSON.parse(arts.content[0].text);
        if (Array.isArray(arts)) setArtifacts(arts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Release Distribution</div>
        <h1 className="text-2xl font-black text-white mt-1">Artifact Downloads</h1>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically verified compilation outputs ready for direct installation (APK), store publishing (AAB), and web deployment (ZIP).
        </p>
      </div>

      <div className="bg-[#111625] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-[#161e31] border-b border-white/5 grid grid-cols-12 text-xs font-bold text-slate-400">
          <div className="col-span-4">Artifact Name / ID</div>
          <div className="col-span-2">Format</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Created At</div>
          <div className="col-span-2 text-right">Download</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading artifacts...</div>
        ) : artifacts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No output artifacts available.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {artifacts.map(a => {
              const isApk = a.name.includes('apk');
              const isAab = a.name.includes('aab');
              return (
                <div key={a.artifact_id} className="px-6 py-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition-colors text-xs">
                  <div className="col-span-4">
                    <div className="font-mono font-bold text-white flex items-center gap-2">
                      <span>{isApk ? '🤖' : isAab ? '📦' : '🌐'}</span>
                      <span className="truncate">{a.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {a.artifact_id}</div>
                  </div>

                  <div className="col-span-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      isApk ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                      isAab ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isApk ? 'Release APK' : isAab ? 'Play Bundle' : 'Web Bundle'}
                    </span>
                  </div>

                  <div className="col-span-2 font-mono text-slate-300">
                    {(a.size_bytes / (1024 * 1024)).toFixed(2)} MB
                  </div>

                  <div className="col-span-2 text-slate-400 text-[11px]">
                    {new Date(a.created_at).toLocaleDateString()}
                  </div>

                  <div className="col-span-2 text-right">
                    <a
                      href={`${a.download_url}?key=uab_demo_key`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-900 font-bold text-xs shadow-md shadow-emerald-500/10 hover:bg-emerald-400 transition-all"
                    >
                      <span>Download</span>
                      <span>&darr;</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
