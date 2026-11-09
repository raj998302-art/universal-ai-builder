'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AIBuilderWorkspace() {
  const [prompt, setPrompt] = useState('Create a modern ecommerce store for high-end electronics with responsive cards and shopping cart');
  const [projectType, setProjectType] = useState<'web' | 'flutter' | 'android'>('web');
  const [projectName, setProjectName] = useState('hyper_store_app');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<string>('index.html');
  const [fileContent, setFileContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  const suggestions = [
    'Create a modern ecommerce store with shopping cart and product catalog',
    'Build a SaaS analytics metrics dashboard with interactive graphs and KPIs',
    'Create a developer portfolio with project showcase and dark theme',
    'Build a personal habit and productivity tracker Flutter app',
    'Create a native Kotlin Android utility with local preferences storage',
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSaveStatus('');
    try {
      const endpoint = '/api/mcp';
      const toolName = projectType === 'web' ? 'generate_website' : 'generate_application';
      const toolArgs = projectType === 'web'
        ? { prompt, name: projectName, framework: 'react' }
        : { prompt, type: projectType, name: projectName };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer uab_demo_key',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: toolName, arguments: toolArgs },
        }),
      });

      const data = await res.json();
      let result = data.result;
      if (result?.content?.[0]?.text) {
        result = JSON.parse(result.content[0].text);
      }

      setGeneratedProject(result);

      // Load file list and first file
      const filesRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer uab_demo_key',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: 'list_files', arguments: { project_id: result.project_id } },
        }),
      });
      const filesData = await filesRes.json();
      let fileList = filesData.result;
      if (fileList?.content?.[0]?.text) {
        fileList = JSON.parse(fileList.content[0].text);
      }

      if (fileList && fileList.length > 0) {
        const first = fileList[0].file_path;
        setSelectedFile(first);
        loadFile(result.project_id, first);
      }
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadFile = async (projId: string, path: string) => {
    setSelectedFile(path);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer uab_demo_key',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: 'read_file', arguments: { project_id: projId, file_path: path } },
        }),
      });
      const data = await res.json();
      let r = data.result;
      if (r?.content?.[0]?.text) r = JSON.parse(r.content[0].text);
      setFileContent(r.content || '');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFile = async () => {
    if (!generatedProject) return;
    setSaveStatus('Saving...');
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer uab_demo_key',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'write_file',
            arguments: {
              project_id: generatedProject.project_id,
              file_path: selectedFile,
              content: fileContent,
            },
          },
        }),
      });
      setSaveStatus('Saved successfully ✅');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch {
      setSaveStatus('Save failed ❌');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Studio Workspace</div>
        <h1 className="text-2xl font-black text-white mt-1">AI Prompt-to-Application Studio</h1>
        <p className="text-xs text-slate-400 mt-1">
          Describe any application or website. The engine crafts complete codebases ready for instant preview and cloud compilation.
        </p>
      </div>

      {/* Generation Panel */}
      <div className="bg-[#111625]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-md space-y-4">
        {/* Framework Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Target Platform:</span>
          {(['web', 'flutter', 'android'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setProjectType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                projectType === t
                  ? 'bg-sky-500 text-slate-900 shadow-md shadow-sky-500/20'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {t === 'web' ? '🌐 Web (React/HTML)' : t === 'flutter' ? '💙 Flutter (Android)' : '🤖 Native Android (Kotlin)'}
            </button>
          ))}
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">Natural Language Specification</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full bg-[#090d16] border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            placeholder="Describe features, pages, components, and design requirements..."
          />
        </div>

        {/* Preset Suggestions */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(s)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/5 transition-all text-left"
            >
              + {s}
            </button>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="project_name"
            className="bg-[#090d16] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 w-64 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-sky-500/20 hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Generating Codebase...</span>
              </>
            ) : (
              <>
                <span>✨ Generate Full Project</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor & File Explorer (Visible when project exists) */}
      {generatedProject && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Project ID:</span>
              <code className="text-xs bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">
                {generatedProject.project_id}
              </code>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus && <span className="text-xs text-emerald-400 font-semibold">{saveStatus}</span>}
              <button
                onClick={handleSaveFile}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs hover:bg-emerald-600/30 transition-all"
              >
                💾 Save File
              </button>
              {generatedProject.type === 'web' && (
                <Link
                  href={`/dashboard/preview?id=${generatedProject.project_id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 font-semibold text-xs hover:bg-sky-500/30 transition-all"
                >
                  🌐 Live Preview
                </Link>
              )}
              <Link
                href={`/dashboard/builds/android?id=${generatedProject.project_id}`}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs hover:bg-indigo-500/30 transition-all"
              >
                🔨 Start Cloud Build
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* File List */}
            <div className="bg-[#111625] border border-white/5 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Project Explorer</div>
              <div className="space-y-1">
                {(generatedProject.files_generated || ['index.html', 'package.json']).map((f: string) => (
                  <button
                    key={f}
                    onClick={() => loadFile(generatedProject.project_id, f)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all truncate block ${
                      selectedFile === f
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    📄 {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Editor */}
            <div className="md:col-span-3 bg-[#0d121f] border border-white/5 rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 bg-[#161e31] border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-slate-300">{selectedFile}</span>
                <span>{fileContent.length} characters</span>
              </div>
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                rows={22}
                className="w-full h-full bg-[#090d16] p-4 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
