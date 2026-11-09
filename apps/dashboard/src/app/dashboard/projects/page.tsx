'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'web' | 'flutter' | 'android'>('all');

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
        params: { name: 'list_projects', arguments: {} },
      }),
    })
      .then(res => res.json())
      .then(data => {
        let list = data.result;
        if (list?.content?.[0]?.text) list = JSON.parse(list.content[0].text);
        if (Array.isArray(list)) setProjects(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.type === filter);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Repository</div>
          <h1 className="text-2xl font-black text-white mt-1">My Application Projects</h1>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 hover:opacity-95 transition-all flex items-center gap-1.5"
        >
          <span>➕ Create Project</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'web', 'flutter', 'android'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-sky-500 text-slate-900 shadow-sm' : 'bg-white/[0.04] text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading projects...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-[#111625] rounded-xl border border-white/5 text-slate-400 text-xs">
          No projects found. Use the AI Builder or click &quot;Create Project&quot; to begin.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filtered.map(p => (
            <div key={p.id} className="bg-[#111625] border border-white/5 rounded-xl p-5 hover:border-sky-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    p.type === 'flutter' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                    p.type === 'android' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {p.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{p.id}</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-3">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description || 'No description provided'}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <Link href={`/dashboard/builder?id=${p.id}`} className="text-sky-400 hover:text-sky-300 font-semibold">
                  Open Editor &rarr;
                </Link>
                {p.type === 'web' ? (
                  <Link href={`/dashboard/preview?id=${p.id}`} className="text-emerald-400 hover:text-emerald-300 font-semibold">
                    Preview &rarr;
                  </Link>
                ) : (
                  <Link href={`/dashboard/builds/android?id=${p.id}`} className="text-indigo-400 hover:text-indigo-300 font-semibold">
                    Build APK &rarr;
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
