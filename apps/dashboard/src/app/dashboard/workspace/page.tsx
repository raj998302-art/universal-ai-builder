'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface FileItem {
  file_path: string;
  size: number;
}

interface ProjectData {
  id: string;
  name: string;
  type: 'web' | 'android' | 'flutter';
  description?: string;
}

export default function WorkspaceIDE() {
  // State
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [isSavingFile, setIsSavingFile] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Right pane tabs: 'preview' | 'agent' | 'builds' | 'settings'
  const [activeTab, setActiveTab] = useState<'preview' | 'agent' | 'builds' | 'settings'>('preview');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // AI Agent panel state
  const [agentPrompt, setAgentPrompt] = useState<string>('');
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
  const [agentSteps, setAgentSteps] = useState<any[]>([]);
  const [agentResult, setAgentResult] = useState<any>(null);
  const [proposedDiff, setProposedDiff] = useState<{ path: string; oldContent: string; newContent: string } | null>(null);

  // Build terminal state
  const [buildLogs, setBuildLogs] = useState<string[]>([
    '[System] Universal AI Builder Control Plane ready.',
    '[System] Select a file to inspect or enter an AI prompt to build.',
  ]);
  const [activeBuildId, setActiveBuildId] = useState<string>('');
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildStatus, setBuildStatus] = useState<string>('idle');
  const [artifacts, setArtifacts] = useState<any[]>([]);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // When selected project changes, load files and artifacts
  useEffect(() => {
    if (selectedProjectId) {
      fetchFiles(selectedProjectId);
      fetchArtifacts(selectedProjectId);
    }
  }, [selectedProjectId]);

  // When selected file changes, load content
  useEffect(() => {
    if (selectedProjectId && selectedFilePath) {
      loadFileContent(selectedProjectId, selectedFilePath);
    }
  }, [selectedFilePath]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        const list = data.projects || [];
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) {
          setSelectedProjectId(list[0].id);
        }
      }
    } catch {}
  };

  const fetchFiles = async (projectId: string) => {
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer uab_demo' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: 'list_files', arguments: { project_id: projectId } },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.result?.content?.[0]?.text;
        const parsed = text ? JSON.parse(text) : data.result;
        const fileList = parsed.files || [];
        setFiles(fileList);
        if (fileList.length > 0) {
          setSelectedFilePath(fileList[0].file_path);
        }
      }
    } catch {}
  };

  const loadFileContent = async (projectId: string, filePath: string) => {
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer uab_demo' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: 'read_file', arguments: { project_id: projectId, file_path: filePath } },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.result?.content?.[0]?.text;
        const parsed = text ? JSON.parse(text) : data.result;
        setFileContent(parsed.content || '');
      }
    } catch {}
  };

  const saveCurrentFile = async () => {
    if (!selectedProjectId || !selectedFilePath) return;
    setIsSavingFile(true);
    setSaveStatus('Saving...');
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer uab_demo' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'write_file',
            arguments: {
              project_id: selectedProjectId,
              file_path: selectedFilePath,
              content: fileContent,
            },
          },
        }),
      });
      if (res.ok) {
        setSaveStatus('Saved!');
        setTimeout(() => setSaveStatus(''), 2500);
      } else {
        setSaveStatus('Error saving');
      }
    } catch {
      setSaveStatus('Error saving');
    } finally {
      setIsSavingFile(false);
    }
  };

  const fetchArtifacts = async (projectId: string) => {
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer uab_demo' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: 'list_artifacts', arguments: { project_id: projectId } },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.result?.content?.[0]?.text;
        const parsed = text ? JSON.parse(text) : data.result;
        setArtifacts(parsed.artifacts || []);
      }
    } catch {}
  };

  // Run Autonomous Agent Loop
  const handleRunAgent = async () => {
    if (!agentPrompt.trim()) return;
    setIsAgentRunning(true);
    setAgentSteps([]);
    setAgentResult(null);
    setBuildLogs(prev => [...prev, `[Agent] Initializing autonomous loop for prompt: "${agentPrompt}"`]);

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer uab_demo' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'run_ai_agent',
            arguments: {
              prompt: agentPrompt,
              project_id: selectedProjectId || undefined,
              max_retries: 2,
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.result?.content?.[0]?.text;
        const execution = text ? JSON.parse(text) : data.result;
        setAgentResult(execution);
        setAgentSteps(execution.steps || []);

        if (execution.project_id && execution.project_id !== selectedProjectId) {
          setSelectedProjectId(execution.project_id);
          fetchProjects();
        } else {
          fetchFiles(selectedProjectId);
        }

        setBuildLogs(prev => [
          ...prev,
          `[Agent] Workflow completed with status: ${execution.status}`,
          `[Agent] Fixes applied: ${execution.fixes_applied || 0}`,
        ]);
      }
    } catch (err: any) {
      setBuildLogs(prev => [...prev, `[Agent Error] ${err.message}`]);
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Trigger Build
  const handleTriggerBuild = async (buildType: 'apk' | 'aab' | 'web') => {
    if (!selectedProjectId) return;
    setIsBuilding(true);
    setBuildStatus('dispatching');
    setBuildLogs(prev => [...prev, `[Build] Dispatching cloud build job for ${buildType.toUpperCase()}...`]);

    try {
      const toolName = buildType === 'web' ? 'build_website' : buildType === 'apk' ? 'build_android_apk' : 'build_android_aab';
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer uab_demo' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: toolName, arguments: { project_id: selectedProjectId } },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.result?.content?.[0]?.text;
        const parsed = text ? JSON.parse(text) : data.result;
        const bId = parsed.build_id;
        setActiveBuildId(bId);
        setBuildStatus('building');
        setBuildLogs(prev => [...prev, `[Build] Job registered: ${bId}. Monitoring runner...`]);

        // Start polling
        pollBuild(bId);
      }
    } catch (e: any) {
      setBuildStatus('failed');
      setIsBuilding(false);
      setBuildLogs(prev => [...prev, `[Build Error] ${e.message}`]);
    }
  };

  const pollBuild = async (bId: string) => {
    let complete = false;
    let count = 0;
    while (!complete && count < 40) {
      count++;
      await new Promise(r => setTimeout(r, 6000));
      try {
        const res = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer uab_demo' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: { name: 'get_build_status', arguments: { build_id: bId } },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.result?.content?.[0]?.text;
          const status = text ? JSON.parse(text) : data.result;
          setBuildStatus(status.status || 'building');
          setBuildLogs(prev => [...prev, `[Build Status] State: ${status.status}, Conclusion: ${status.conclusion || 'pending'}`]);

          if (status.status === 'success' || status.conclusion === 'success') {
            complete = true;
            setIsBuilding(false);
            setBuildLogs(prev => [...prev, `✅ Build succeeded! Artifacts: ${status.artifacts?.length || 1}`]);
            fetchArtifacts(selectedProjectId);
          } else if (status.status === 'failed' || status.conclusion === 'failure') {
            complete = true;
            setIsBuilding(false);
            setBuildLogs(prev => [...prev, `❌ Build failed. Check runner diagnostics.`]);
          }
        }
      } catch {}
    }
    setIsBuilding(false);
  };

  const currentProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#070a12] text-slate-100 font-sans overflow-hidden">
      {/* Top Workspace Bar */}
      <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-[#0b0f19] shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
            ← Dashboard
          </Link>
          <span className="text-white/20">|</span>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="bg-[#161e31] border border-white/10 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 font-medium"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
          {currentProject && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase font-semibold">
              {currentProject.type}
            </span>
          )}
        </div>

        {/* Quick Build Action Buttons */}
        <div className="flex items-center space-x-2">
          {currentProject?.type === 'web' ? (
            <button
              onClick={() => handleTriggerBuild('web')}
              disabled={isBuilding}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <span>🌐</span> {isBuilding ? 'Building Web...' : 'Build Production Web'}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleTriggerBuild('apk')}
                disabled={isBuilding}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <span>🤖</span> {isBuilding ? 'Compiling APK...' : 'Build Release APK'}
              </button>
              <button
                onClick={() => handleTriggerBuild('aab')}
                disabled={isBuilding}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <span>📦</span> {isBuilding ? 'Compiling AAB...' : 'Build Bundle (AAB)'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main 3-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: File Explorer Tree (w-60) */}
        <div className="w-64 border-r border-white/10 bg-[#090d16] flex flex-col shrink-0">
          <div className="p-3 border-b border-white/10 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Explorer ({files.length})</span>
            <button
              onClick={() => fetchFiles(selectedProjectId)}
              className="hover:text-white transition"
              title="Refresh Files"
            >
              ↻
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {files.map(f => (
              <button
                key={f.file_path}
                onClick={() => setSelectedFilePath(f.file_path)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono flex items-center justify-between group transition ${
                  selectedFilePath === f.file_path
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <span className="text-slate-500 text-[10px]">
                    {f.file_path.endsWith('.tsx') || f.file_path.endsWith('.ts')
                      ? '⚛️'
                      : f.file_path.endsWith('.kt')
                      ? '☕'
                      : f.file_path.endsWith('.html')
                      ? '📄'
                      : f.file_path.endsWith('.css')
                      ? '🎨'
                      : '⚙️'}
                  </span>
                  {f.file_path}
                </span>
                <span className="text-[10px] text-slate-600 group-hover:text-slate-400">
                  {(f.size / 1024).toFixed(1)}k
                </span>
              </button>
            ))}
            {files.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-6">No files in project</p>
            )}
          </div>
        </div>

        {/* CENTER PANE: Code Editor & Terminal (flex-1) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/10">
          {/* File Header Bar */}
          <div className="h-9 border-b border-white/10 px-4 flex items-center justify-between bg-[#0e1422] text-xs">
            <div className="flex items-center space-x-2 font-mono text-slate-300">
              <span className="text-slate-500">file:</span>
              <span className="font-semibold text-sky-400">{selectedFilePath || 'No file selected'}</span>
            </div>
            <div className="flex items-center space-x-3">
              {saveStatus && <span className="text-[11px] text-emerald-400 font-semibold">{saveStatus}</span>}
              <button
                onClick={saveCurrentFile}
                disabled={isSavingFile || !selectedFilePath}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-40 text-slate-200 text-xs px-2.5 py-1 rounded font-medium transition"
              >
                {isSavingFile ? 'Saving...' : 'Save File (Ctrl+S)'}
              </button>
            </div>
          </div>

          {/* Textarea Code Editor */}
          <div className="flex-1 relative bg-[#090d16] overflow-hidden flex">
            {/* Line numbers dummy */}
            <div className="w-10 bg-[#070a12] border-r border-white/5 select-none text-[11px] font-mono text-slate-600 text-right pr-2 pt-3">
              {Array.from({ length: Math.min(30, (fileContent.match(/\n/g) || []).length + 1) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={fileContent}
              onChange={e => setFileContent(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  saveCurrentFile();
                }
              }}
              spellCheck={false}
              className="flex-1 p-3 bg-transparent font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed overflow-auto"
              placeholder="// Select a source file to edit code..."
            />
          </div>

          {/* BOTTOM TERMINAL: Build Logs (h-48) */}
          <div className="h-44 border-t border-white/10 bg-[#07090e] flex flex-col shrink-0">
            <div className="h-7 border-b border-white/5 px-3 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span>Console Output</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    buildStatus === 'building' ? 'bg-amber-400 animate-ping' : buildStatus === 'success' ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
              </div>
              <button onClick={() => setBuildLogs([])} className="hover:text-slate-300">
                Clear
              </button>
            </div>
            <div className="flex-1 p-2 font-mono text-[11px] overflow-y-auto space-y-1 text-slate-400">
              {buildLogs.map((log, i) => (
                <div key={i} className="leading-tight">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Tabs (Preview, AI Agent, Builds, Settings) (w-96) */}
        <div className="w-96 bg-[#090d16] flex flex-col shrink-0">
          {/* Tabs header */}
          <div className="h-9 border-b border-white/10 flex items-center px-2 bg-[#0b0f19] text-xs font-semibold text-slate-400">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-t-lg transition ${
                activeTab === 'preview' ? 'bg-[#090d16] text-sky-400 border-b-2 border-sky-500 font-bold' : 'hover:text-slate-200'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`px-3 py-1.5 rounded-t-lg transition ${
                activeTab === 'agent' ? 'bg-[#090d16] text-sky-400 border-b-2 border-sky-500 font-bold' : 'hover:text-slate-200'
              }`}
            >
              AI Agent
            </button>
            <button
              onClick={() => setActiveTab('builds')}
              className={`px-3 py-1.5 rounded-t-lg transition ${
                activeTab === 'builds' ? 'bg-[#090d16] text-sky-400 border-b-2 border-sky-500 font-bold' : 'hover:text-slate-200'
              }`}
            >
              Artifacts
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-t-lg transition ${
                activeTab === 'settings' ? 'bg-[#090d16] text-sky-400 border-b-2 border-sky-500 font-bold' : 'hover:text-slate-200'
              }`}
            >
              Settings
            </button>
          </div>

          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="flex-1 flex flex-col p-3 space-y-2 overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Live Device View</span>
                <div className="flex items-center space-x-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                  <button
                    onClick={() => setViewportMode('desktop')}
                    className={`px-2 py-0.5 text-[10px] rounded ${viewportMode === 'desktop' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setViewportMode('mobile')}
                    className={`px-2 py-0.5 text-[10px] rounded ${viewportMode === 'mobile' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              {selectedProjectId ? (
                <div className="flex-1 bg-black rounded-lg border border-white/10 overflow-hidden flex items-center justify-center p-1">
                  <iframe
                    src={`/api/preview/${selectedProjectId}`}
                    title="Live Preview"
                    className={`h-full border-0 transition-all rounded ${
                      viewportMode === 'mobile' ? 'w-[320px] shadow-2xl' : 'w-full'
                    }`}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                  Select a project to render live preview
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI AGENT */}
          {activeTab === 'agent' && (
            <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Autonomous AI Prompt
                </label>
                <textarea
                  value={agentPrompt}
                  onChange={e => setAgentPrompt(e.target.value)}
                  placeholder="e.g. Add an about page with company statistics and team cards, or modify hero title to Apex SaaS..."
                  className="w-full h-24 p-2.5 bg-[#161e31] border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none font-sans"
                />
              </div>

              <button
                onClick={handleRunAgent}
                disabled={isAgentRunning || !agentPrompt.trim()}
                className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2"
              >
                <span>{isAgentRunning ? '⏳' : '⚡'}</span>
                <span>{isAgentRunning ? 'Executing Autonomous Agent Loop...' : 'Run Autonomous Agent'}</span>
              </button>

              {/* Progress Steps Feed */}
              {agentSteps.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Execution Steps
                  </span>
                  <div className="space-y-1">
                    {agentSteps.map(step => (
                      <div
                        key={step.step_number}
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="text-sky-400 font-bold">{step.phase}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold ${
                              step.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : step.status === 'failed'
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-amber-500/10 text-amber-400 animate-pulse'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{step.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ARTIFACTS */}
          {activeTab === 'builds' && (
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Generated Artifacts ({artifacts.length})
              </span>
              <div className="space-y-2">
                {artifacts.map(art => (
                  <div
                    key={art.artifact_id || art.id}
                    className="p-3 bg-[#161e31] border border-white/10 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate max-w-[200px]">
                        {art.name || art.filename}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {((art.size_bytes || 0) / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <a
                      href={art.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-semibold py-1.5 rounded-lg transition"
                    >
                      Download Artifact ↓
                    </a>
                  </div>
                ))}
                {artifacts.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-8">
                    No artifacts compiled for this project yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="flex-1 p-3 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  readOnly
                  value={currentProject?.name || ''}
                  className="w-full bg-[#161e31] border border-white/10 rounded px-2.5 py-1.5 text-slate-300"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Project ID</label>
                <input
                  type="text"
                  readOnly
                  value={currentProject?.id || ''}
                  className="w-full bg-[#161e31] border border-white/10 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-400"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Framework Target</label>
                <input
                  type="text"
                  readOnly
                  value={currentProject?.type?.toUpperCase() || ''}
                  className="w-full bg-[#161e31] border border-white/10 rounded px-2.5 py-1.5 text-slate-300"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
