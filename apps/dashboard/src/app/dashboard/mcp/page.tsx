'use client';

import { useState } from 'react';

export default function MCPConnectionsPage() {
  const [activeTab, setActiveTab] = useState<'chatgpt' | 'gemini' | 'claude' | 'cursor'>('chatgpt');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const mcpEndpoint = 'https://universal-ai-builder-nine.vercel.app/api/mcp';

  const chatgptConfig = JSON.stringify({
    name: "Universal AI Builder",
    url: mcpEndpoint,
    authentication: {
      type: "bearer",
      token: "YOUR_API_KEY"
    },
    transport: "streamable-http"
  }, null, 2);

  const geminiConfig = `# Gemini CLI Configuration (~/.gemini/config.json or CLI invocation)
gemini mcp add universal-ai-builder \\
  --url "${mcpEndpoint}" \\
  --header "Authorization: Bearer YOUR_API_KEY"`;

  const claudeConfig = JSON.stringify({
    mcpServers: {
      "universal-ai-builder": {
        url: mcpEndpoint,
        headers: {
          Authorization: "Bearer YOUR_API_KEY"
        }
      }
    }
  }, null, 2);

  const cursorConfig = `MCP Server Name: universal-ai-builder
Type: SSE / Remote HTTP
URL: ${mcpEndpoint}
Headers: Authorization: Bearer YOUR_API_KEY`;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = Date.now();
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
          method: 'tools/list',
        }),
      });
      const data = await res.json();
      const elapsed = Date.now() - start;
      const tools = data.result?.tools || [];
      setTestResult({
        status: 'online',
        latency: `${elapsed}ms`,
        toolsCount: tools.length,
        version: '2.0.0',
      });
    } catch (err: any) {
      setTestResult({ status: 'error', error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const copyConfig = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">External AI Protocols</div>
        <h1 className="text-2xl font-black text-white mt-1">Model Context Protocol (MCP) Studio</h1>
        <p className="text-xs text-slate-400 mt-1">
          Connect ChatGPT, Google Gemini CLI, Claude, Cursor, and custom AI agents directly to Universal AI Builder.
        </p>
      </div>

      {/* Live Ping Tester */}
      <div className="bg-[#111625]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white">Live Remote MCP Endpoint</span>
          </div>
          <code className="text-xs text-sky-400 font-mono mt-1 block">{mcpEndpoint}</code>
        </div>
        <div className="flex items-center gap-3">
          {testResult && (
            <div className="text-xs text-slate-300 font-mono bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
              Status: <span className="text-emerald-400 font-bold">{testResult.status}</span> · Latency: <span className="text-sky-400">{testResult.latency}</span> · Tools: <span className="text-indigo-400 font-bold">{testResult.toolsCount}</span>
            </div>
          )}
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold text-xs hover:bg-sky-500/30 transition-all flex items-center gap-2"
          >
            {isTesting ? 'Pinging Endpoint...' : '⚡ Test Connection'}
          </button>
        </div>
      </div>

      {/* Client Configuration Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          {[
            { id: 'chatgpt', label: 'ChatGPT Custom Apps', icon: '🤖' },
            { id: 'gemini', label: 'Google Gemini CLI', icon: '💎' },
            { id: 'claude', label: 'Claude Desktop', icon: '🧠' },
            { id: 'cursor', label: 'Cursor IDE', icon: '⚡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-slate-900 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="bg-[#111625] border border-white/5 rounded-2xl p-6 space-y-4">
          {activeTab === 'chatgpt' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">ChatGPT Remote MCP Connection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect Universal AI Builder to ChatGPT using remote MCP Streamable HTTP transport. Allows ChatGPT Plus, Pro, and Enterprise accounts to create mobile apps, build websites, and compile real APKs directly from chat.
              </p>
              <div className="relative">
                <pre className="bg-[#090d16] p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto border border-white/5">
                  {chatgptConfig}
                </pre>
                <button
                  onClick={() => copyConfig(chatgptConfig)}
                  className="absolute top-3 right-3 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white font-semibold"
                >
                  {copied ? 'Copied! ✅' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'gemini' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Google Gemini CLI Configuration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use the Google Gemini CLI with Universal AI Builder MCP server. Execute builds and manage files directly through terminal AI.
              </p>
              <div className="relative">
                <pre className="bg-[#090d16] p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto border border-white/5">
                  {geminiConfig}
                </pre>
                <button
                  onClick={() => copyConfig(geminiConfig)}
                  className="absolute top-3 right-3 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white font-semibold"
                >
                  {copied ? 'Copied! ✅' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'claude' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Claude Desktop Configuration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add to your <code className="text-sky-400">claude_desktop_config.json</code> under <code className="text-sky-400">mcpServers</code>:
              </p>
              <div className="relative">
                <pre className="bg-[#090d16] p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto border border-white/5">
                  {claudeConfig}
                </pre>
                <button
                  onClick={() => copyConfig(claudeConfig)}
                  className="absolute top-3 right-3 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white font-semibold"
                >
                  {copied ? 'Copied! ✅' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cursor' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Cursor IDE MCP Settings</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Navigate to <b>Cursor Settings &gt; Features &gt; MCP</b> and add the remote server:
              </p>
              <div className="relative">
                <pre className="bg-[#090d16] p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto border border-white/5">
                  {cursorConfig}
                </pre>
                <button
                  onClick={() => copyConfig(cursorConfig)}
                  className="absolute top-3 right-3 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white font-semibold"
                >
                  {copied ? 'Copied! ✅' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
