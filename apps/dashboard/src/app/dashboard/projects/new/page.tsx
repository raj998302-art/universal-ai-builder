'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectWizard() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<'web' | 'flutter' | 'android'>('web');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('Project name is required');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer uab_demo_key',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'create_project',
            arguments: { name, type, description },
          },
        }),
      });
      const data = await res.json();
      let result = data.result;
      if (result?.content?.[0]?.text) result = JSON.parse(result.content[0].text);
      router.push(`/dashboard/builder?id=${result.id}`);
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Project Setup</div>
        <h1 className="text-2xl font-black text-white mt-1">Create New Project</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure an empty project container or start editing in the AI Builder Workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111625] border border-white/5 rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MyMobileApp"
            required
            className="w-full bg-[#090d16] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Target Framework</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'web', title: 'Web App', icon: '🌐', desc: 'React, Next.js, HTML5' },
              { id: 'flutter', title: 'Flutter App', icon: '💙', desc: 'Cross-platform Android' },
              { id: 'android', title: 'Native Android', icon: '🤖', desc: 'Kotlin, Gradle, AGP' },
            ].map(f => (
              <button
                type="button"
                key={f.id}
                onClick={() => setType(f.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  type === f.id
                    ? 'bg-sky-500/15 border-sky-500/40 text-white shadow-md shadow-sky-500/10'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xl">{f.icon}</span>
                <div className="text-xs font-bold mt-1.5">{f.title}</div>
                <div className="text-[10px] text-slate-500">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional project description..."
            className="w-full bg-[#090d16] border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-sky-500/20 hover:opacity-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Project...' : 'Initialize Project'}
        </button>
      </form>
    </div>
  );
}
