'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string;
  createdAt: string;
  lastUsedAt: string | null;
  role: 'admin' | 'builder' | 'readonly';
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRole, setNewKeyRole] = useState<'admin' | 'builder' | 'readonly'>('builder');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // Load initial keys or mock stored keys
    const stored = localStorage.getItem('uab_api_keys');
    if (stored) {
      try {
        setKeys(JSON.parse(stored));
      } catch {
        // ignore
      }
    } else {
      const defaultKeys: ApiKey[] = [
        {
          id: 'key_prod_master_1',
          name: 'Production Master Agent Key',
          keyPrefix: 'uab_live_9f8e2...',
          createdAt: '2026-11-09T05:00:00Z',
          lastUsedAt: 'Just now',
          role: 'admin',
        },
        {
          id: 'key_chatgpt_live',
          name: 'ChatGPT Custom Action Key',
          keyPrefix: 'uab_live_4b7c1...',
          createdAt: '2026-11-09T06:30:00Z',
          lastUsedAt: '5m ago',
          role: 'builder',
        },
        {
          id: 'key_gemini_cli',
          name: 'Gemini CLI MCP Key',
          keyPrefix: 'uab_live_8a3d6...',
          createdAt: '2026-11-09T07:15:00Z',
          lastUsedAt: '12m ago',
          role: 'builder',
        },
      ];
      setKeys(defaultKeys);
      localStorage.setItem('uab_api_keys', JSON.stringify(defaultKeys));
    }
  }, []);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const fullKey = `uab_live_${randomBytes}`;
    const prefix = `uab_live_${randomBytes.slice(0, 5)}...`;

    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      keyPrefix: prefix,
      fullKey,
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Never',
      role: newKeyRole,
    };

    const updated = [newKey, ...keys];
    setKeys(updated);
    localStorage.setItem('uab_api_keys', JSON.stringify(updated.map(k => ({ ...k, fullKey: undefined }))));
    setCreatedKey(fullKey);
    setNewKeyName('');
  };

  const handleRevoke = (id: string) => {
    const updated = keys.filter((k) => k.id !== id);
    setKeys(updated);
    localStorage.setItem('uab_api_keys', JSON.stringify(updated));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">API Keys & Access Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage secure credentials for ChatGPT, Gemini CLI, Claude, Cursor, and automated CI/CD runners.
        </p>
      </div>

      {/* Newly Created Key Alert Banner */}
      {createdKey && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-200 space-y-3 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔐</span>
              <span className="font-semibold text-emerald-300 text-sm">Key Generated Successfully</span>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-emerald-300/80">
            Please copy this API key immediately. You will not be able to view this full secret token again!
          </p>
          <div className="flex items-center space-x-2 bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
            <code className="text-xs font-mono text-emerald-400 flex-1 select-all break-all">{createdKey}</code>
            <button
              onClick={() => copyToClipboard(createdKey, 'new_key')}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded transition-colors shrink-0"
            >
              {copied === 'new_key' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Generate New Key Card */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <h2 className="text-base font-semibold text-white">Create New API Key</h2>
        <form onSubmit={handleGenerateKey} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Key Description / Name</label>
            <input
              type="text"
              placeholder="e.g. Cursor IDE Build Assistant"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Permissions Scope</label>
            <select
              value={newKeyRole}
              onChange={(e) => setNewKeyRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="builder">Builder (Projects + Builds)</option>
              <option value="admin">Admin (Full Control)</option>
              <option value="readonly">Read-Only (Status & Logs)</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-black font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-sky-500/20"
          >
            Generate Key
          </button>
        </form>
      </div>

      {/* Active API Keys List */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Active Access Tokens</h2>
          <span className="text-xs text-slate-400 font-mono">{keys.length} Keys Configured</span>
        </div>

        <div className="divide-y divide-white/5">
          {keys.map((key) => (
            <div key={key.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-sm text-white">{key.name}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    key.role === 'admin'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : key.role === 'builder'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}>
                    {key.role}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>Prefix: <code className="text-slate-300 font-mono">{key.keyPrefix}</code></span>
                  <span>•</span>
                  <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Last Active: {key.lastUsedAt || 'Never'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto">
                <button
                  onClick={() => copyToClipboard(key.keyPrefix, key.id)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                >
                  {copied === key.id ? 'Copied Prefix' : 'Copy Prefix'}
                </button>
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Best Practices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <span>🛡️</span>
            <span>Security Guidelines</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Universal AI Builder keys grant programmatic ability to launch GitHub Actions runners, generate source code, and trigger Android builds. Store your keys in environment variables (e.g., <code className="text-sky-300">UAB_API_KEY</code>) and never commit them to public version control.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <span>⚡</span>
            <span>HTTP Header Usage</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Attach your API token to JSON-RPC MCP requests or REST API calls via standard Authorization headers:
            <code className="block mt-1.5 p-2 bg-black/40 rounded border border-white/5 text-[11px] font-mono text-sky-400">
              Authorization: Bearer uab_live_...
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
