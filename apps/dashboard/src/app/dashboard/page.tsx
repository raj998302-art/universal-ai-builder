import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

// Demo data for display when database is not connected
const demoStats = {
  totalProjects: 0,
  totalBuilds: 0,
  successfulBuilds: 0,
  failedBuilds: 0,
};

const demoProjects: Array<{
  id: string;
  name: string;
  type: string;
  description: string;
  created_at: string;
}> = [];

const demoBuilds: Array<{
  id: string;
  project_name: string;
  type: string;
  status: string;
  created_at: string;
}> = [];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h2>
        <Link
          href="/dashboard/settings"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + New Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: demoStats.totalProjects, icon: '📁', color: 'text-blue-600' },
          { label: 'Total Builds', value: demoStats.totalBuilds, icon: '🔨', color: 'text-purple-600' },
          { label: 'Successful', value: demoStats.successfulBuilds, icon: '✅', color: 'text-green-600' },
          { label: 'Failed', value: demoStats.failedBuilds, icon: '❌', color: 'text-red-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Projects List */}
        <Card
          title="Projects"
          action={
            <span className="text-sm text-gray-500">{demoProjects.length} total</span>
          }
        >
          {demoProjects.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No projects yet"
              description="Create your first project to get started building apps with AI."
              action={{ label: 'Create Project', href: '#' }}
            />
          ) : (
            <div className="space-y-3">
              {demoProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                    </div>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {project.type}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Builds */}
        <Card
          title="Recent Builds"
          action={
            <span className="text-sm text-gray-500">{demoBuilds.length} total</span>
          }
        >
          {demoBuilds.length === 0 ? (
            <EmptyState
              icon="🔨"
              title="No builds yet"
              description="Start a build from a project to compile your application."
            />
          ) : (
            <div className="space-y-3">
              {demoBuilds.map((build) => (
                <Link
                  key={build.id}
                  href={`/dashboard/builds/${build.id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {build.project_name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {build.type.toUpperCase()} build
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
    </div>
  );
}
