import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

interface ProjectDetailPageProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const projectId = params.id;

  // Placeholder project data (would be fetched from API in production)
  const project = {
    id: projectId,
    name: 'Loading...',
    type: 'flutter',
    description: 'Project details will load from the API.',
    config: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const files: Array<{ path: string; size: number }> = [];
  const builds: Array<{
    id: string;
    type: string;
    status: string;
    created_at: string;
  }> = [];

  return (
    <div className="space-y-6">
      {/* Project Header */}
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
            {project.name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-700 dark:text-gray-300">
            {project.type}
          </span>
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Start Build
          </button>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500">Project ID</p>
          <p className="font-mono text-sm mt-1 text-gray-900 dark:text-white truncate">{project.id}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500">Created</p>
          <p className="text-sm mt-1 text-gray-900 dark:text-white">
            {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500">Last Updated</p>
          <p className="text-sm mt-1 text-gray-900 dark:text-white">
            {new Date(project.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* File Tree */}
        <Card title="Project Files" action={<span className="text-sm text-gray-500">{files.length} files</span>}>
          {files.length === 0 ? (
            <EmptyState
              icon="📄"
              title="No files yet"
              description="Use the API to write files to this project."
            />
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">📄</span>
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {file.path}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Build History */}
        <Card title="Build History" action={<span className="text-sm text-gray-500">{builds.length} builds</span>}>
          {builds.length === 0 ? (
            <EmptyState
              icon="🔨"
              title="No builds yet"
              description="Start a build to compile your project."
            />
          ) : (
            <div className="space-y-3">
              {builds.map((build) => (
                <Link
                  key={build.id}
                  href={`/dashboard/builds/${build.id}`}
                  className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {build.type.toUpperCase()} Build
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(build.created_at).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={build.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* API Usage Example */}
      <Card title="API Quick Reference">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Write a file</h4>
            <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              <code>{`curl -X POST /api/projects/${projectId}/files \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"path": "lib/main.dart", "content": "..."}'`}</code>
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start a build</h4>
            <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              <code>{`curl -X POST /api/builds \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"project_id": "${projectId}", "type": "apk"}'`}</code>
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
}
