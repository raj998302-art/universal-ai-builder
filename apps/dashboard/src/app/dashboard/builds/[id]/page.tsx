import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

interface BuildDetailPageProps {
  params: { id: string };
}

export default function BuildDetailPage({ params }: BuildDetailPageProps) {
  const buildId = params.id;

  // Placeholder build data (would be fetched from API in production)
  const build = {
    id: buildId,
    project_id: '',
    project_name: 'Loading...',
    type: 'apk',
    status: 'queued',
    started_at: null as string | null,
    completed_at: null as string | null,
    error_message: null as string | null,
    build_config: {},
    created_at: new Date().toISOString(),
  };

  const logs = [
    { timestamp: new Date().toISOString(), message: 'Build details will load from the API...' },
  ];

  return (
    <div className="space-y-6">
      {/* Build Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ← Back
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            Build {buildId.slice(0, 8)}...
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {build.type.toUpperCase()} build for {build.project_name}
          </p>
        </div>
        <StatusBadge status={build.status} />
      </div>

      {/* Build Info */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500">Build ID</p>
          <p className="font-mono text-sm mt-1 text-gray-900 dark:text-white truncate">{build.id}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500">Type</p>
          <p className="text-sm mt-1 text-gray-900 dark:text-white">{build.type.toUpperCase()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500">Created</p>
          <p className="text-sm mt-1 text-gray-900 dark:text-white">
            {new Date(build.created_at).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500">Duration</p>
          <p className="text-sm mt-1 text-gray-900 dark:text-white">
            {build.started_at && build.completed_at
              ? `${Math.round((new Date(build.completed_at).getTime() - new Date(build.started_at).getTime()) / 1000)}s`
              : build.started_at
                ? 'In progress...'
                : 'Not started'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {build.error_message && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-400">Build Error</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{build.error_message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Build Logs */}
      <Card title="Build Logs">
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="flex space-x-3 py-0.5">
              <span className="text-gray-500 flex-shrink-0 select-none">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))}
          {build.status === 'building' && (
            <div className="flex items-center space-x-2 mt-2 text-blue-400">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Building...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Build Config */}
      <Card title="Build Configuration">
        <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
          <code>{JSON.stringify(build.build_config, null, 2)}</code>
        </pre>
      </Card>
    </div>
  );
}
