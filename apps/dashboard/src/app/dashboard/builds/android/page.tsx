'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AndroidBuildCenter() {
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState<string>(searchParams.get('id') || 'proj_OJgUMkToKaiC');
  const [buildTarget, setBuildTarget] = useState<'flutter_apk' | 'flutter_aab' | 'android_apk' | 'android_aab'>('flutter_apk');
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [activeBuild, setActiveBuild] = useState<any>(null);
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleStartBuild = async () => {
    setIsBuilding(true);
    setLogs(['[Client] Dispatching compilation request to Cloud Worker pool...']);
    setStatusInfo(null);

    const toolMap: Record<string, string> = {
      flutter_apk: 'build_flutter_apk',
      flutter_aab: 'build_flutter_aab',
      android_apk: 'build_android_apk',
      android_aab: 'build_android_aab',
    };

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
            name: toolMap[buildTarget],
            arguments: { project_id: projectId },
          },
        }),
      });

      const data = await res.json();
      let result = data.result;
      if (result?.content?.[0]?.text) result = JSON.parse(result.content[0].text);

      setActiveBuild(result);
      setLogs(prev => [...prev, `[Client] Build job registered: ${result.build_id}`, `[Worker] Initializing Docker container runner...`]);

      // Start status polling
      pollStatus(result.build_id);
    } catch (err: any) {
      setIsBuilding(false);
      setLogs(prev => [...prev, `[Error] Build dispatch failed: ${err.message}`]);
    }
  };

  const pollStatus = async (buildId: string) => {
    let completed = false;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 6000));
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
            params: { name: 'get_build_status', arguments: { build_id: buildId } },
          }),
        });
        const data = await res.json();
        let st = data.result;
        if (st?.content?.[0]?.text) st = JSON.parse(st.content[0].text);

        setStatusInfo(st);

        // Fetch logs
        const logRes = await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer uab_demo_key',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: { name: 'get_build_logs', arguments: { build_id: buildId } },
          }),
        });
        const logData = await logRes.json();
        let lg = logData.result;
        if (lg?.content?.[0]?.text) lg = JSON.parse(lg.content[0].text);

        if (lg?.steps) {
          setLogs(lg.steps);
        }

        if (st.status === 'success' || st.status === 'failed') {
          completed = true;
          break;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsBuilding(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Cloud Compilation Engine</div>
        <h1 className="text-2xl font-black text-white mt-1">Android Build Center</h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform real compilation of release APK and Google Play AAB bundles using pinned Android SDK 34 and Flutter 3.24.5 workers.
        </p>
      </div>

      {/* Target Selector & Configuration */}
      <div className="bg-[#111625]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-md space-y-6">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Target Project ID</label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="proj_..."
            className="w-full md:w-96 bg-[#090d16] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-sky-400 font-mono focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-3">Select Output Target & Format</label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { id: 'flutter_apk', name: 'Flutter Release APK', icon: '🤖', desc: 'Direct installation binary (.apk)' },
              { id: 'flutter_aab', name: 'Flutter Play Bundle (AAB)', icon: '📦', desc: 'Google Play Publishing bundle (.aab)' },
              { id: 'android_apk', name: 'Kotlin Release APK', icon: '⚡', desc: 'Native Gradle compiled APK (.apk)' },
              { id: 'android_aab', name: 'Kotlin Play Bundle (AAB)', icon: '📦', desc: 'Native Android bundle (.aab)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setBuildTarget(t.id as any)}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  buildTarget === t.id
                    ? 'bg-indigo-600/15 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                }`}
              >
                <div>
                  <span className="text-xl">{t.icon}</span>
                  <div className="text-xs font-bold text-white mt-2">{t.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{t.desc}</div>
                </div>
                <div className="mt-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    buildTarget === t.id ? 'bg-indigo-500 text-slate-900' : 'text-slate-500'
                  }`}>
                    {buildTarget === t.id ? 'Selected' : 'Select'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-white/5">
          <div className="text-xs text-slate-400">
            Worker Environment: <span className="text-slate-200 font-mono">Ubuntu 22.04 LTS · OpenJDK 17 · Gradle 8.7 · AGP 8.2</span>
          </div>
          <button
            onClick={handleStartBuild}
            disabled={isBuilding}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isBuilding ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Worker Building...</span>
              </>
            ) : (
              <>
                <span>🚀 Trigger Cloud Compilation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Monitor Section */}
      {(activeBuild || logs.length > 0) && (
        <div className="space-y-4">
          {/* Status Header */}
          <div className="bg-[#111625] border border-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Build ID</span>
                <span className="text-xs font-mono text-sky-400 font-bold">{activeBuild?.build_id || 'Pending'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Execution Status</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                  statusInfo?.status === 'success' ? 'text-emerald-400' : statusInfo?.status === 'failed' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    statusInfo?.status === 'success' ? 'bg-emerald-400' : statusInfo?.status === 'failed' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                  }`}></span>
                  {statusInfo?.status || 'dispatched'}
                </span>
              </div>
            </div>

            {/* Direct Download Action */}
            {statusInfo?.artifacts && statusInfo.artifacts.length > 0 && (
              <a
                href={`${statusInfo.artifacts[0].download_url}?key=uab_demo_key`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 font-bold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center gap-2"
              >
                <span>📦 Download {statusInfo.artifacts[0].name}.zip</span>
              </a>
            )}
          </div>

          {/* Live Log Terminal */}
          <div className="bg-[#090d16] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-4 py-2.5 bg-[#161e31] border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Worker Real-Time Execution Console
              </span>
              <span>{logs.length} step(s) logged</span>
            </div>
            <div className="p-4 font-mono text-xs text-slate-300 space-y-1.5 max-h-96 overflow-y-auto">
              {logs.map((line, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-600 select-none">[{idx + 1}]</span>
                  <span className={line.includes('failure') ? 'text-rose-400 font-bold' : line.includes('success') ? 'text-emerald-400' : 'text-slate-300'}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
