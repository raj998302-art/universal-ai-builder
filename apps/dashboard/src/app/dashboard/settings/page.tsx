import Card from '@/components/Card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

      {/* API Keys Section */}
      <Card
        title="API Keys"
        action={
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            Generate New Key
          </button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            API keys are used to authenticate requests to the Universal AI Builder API.
            Keep your keys secure and never share them publicly.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-500">⚠️</span>
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                  Database Not Connected
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Configure the DATABASE_URL environment variable to manage API keys.
                  See the .env.example file for required variables.
                </p>
              </div>
            </div>
          </div>

          {/* Example API Key Display */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Default Key</h4>
                <p className="text-sm text-gray-500 mt-1 font-mono">uab_••••••••••••••••</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Never used</span>
                <button className="text-red-500 hover:text-red-700 text-sm">Revoke</button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Usage Stats */}
      <Card title="Usage Statistics">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">API Requests (30d)</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Builds (30d)</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0 MB</p>
          </div>
        </div>
      </Card>

      {/* Account Settings */}
      <Card title="Account">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled
            />
          </div>
          <p className="text-sm text-gray-500">
            Account settings are managed via the API. Use the auth endpoint to update your profile.
          </p>
        </div>
      </Card>

      {/* Environment Info */}
      <Card title="Environment">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500">Platform</span>
            <span className="text-gray-900 dark:text-white">Universal AI Builder</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500">Version</span>
            <span className="text-gray-900 dark:text-white">0.1.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500">Runtime</span>
            <span className="text-gray-900 dark:text-white">Next.js 14</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Database</span>
            <span className="text-gray-900 dark:text-white">Neon PostgreSQL</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
