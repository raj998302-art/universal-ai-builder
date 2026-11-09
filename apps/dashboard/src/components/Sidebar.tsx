'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navGroups = [
  {
    title: 'Core Platform',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '⚡' },
      { href: '/dashboard/builder', label: 'AI Builder Workspace', icon: '✨', badge: 'AI' },
      { href: '/dashboard/projects', label: 'My Projects', icon: '📁' },
      { href: '/dashboard/projects/new', label: 'New Project', icon: '➕' },
    ],
  },
  {
    title: 'Build & Preview',
    items: [
      { href: '/dashboard/preview', label: 'Website Preview', icon: '🌐' },
      { href: '/dashboard/builds/android', label: 'Android Build Center', icon: '🤖' },
      { href: '/dashboard/builds', label: 'Build History & Logs', icon: '🔨' },
      { href: '/dashboard/artifacts', label: 'Artifact Downloads', icon: '📦' },
    ],
  },
  {
    title: 'Integrations & Access',
    items: [
      { href: '/dashboard/mcp', label: 'MCP Connections', icon: '🔌', badge: 'Live' },
      { href: '/dashboard/api-keys', label: 'API Keys', icon: '🔑' },
      { href: '/dashboard/settings', label: 'Account Settings', icon: '⚙️' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0b0f19] border-r border-white/5 text-slate-200 min-h-screen flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white text-lg font-black">✦</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">Universal AI</div>
            <div className="text-[11px] font-medium text-sky-400">App & Web Builder</div>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {group.title}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badge === 'AI' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>MCP Server</span>
          <span className="inline-flex items-center text-emerald-400 gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            29 Tools Active
          </span>
        </div>
      </div>
    </aside>
  );
}
