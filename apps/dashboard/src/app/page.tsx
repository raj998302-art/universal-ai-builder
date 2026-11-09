import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🚀</span>
              <span className="text-xl font-bold">Universal AI Builder</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#getting-started" className="text-gray-300 hover:text-white transition-colors">
                Getting Started
              </a>
              <Link
                href="/dashboard"
                className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Build Apps with AI
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
          Generate, build, and deploy Flutter, Android, and web applications using
          AI-powered tools. From idea to APK in minutes, not months.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="bg-primary-600 hover:bg-primary-700 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Open Dashboard
          </Link>
          <a
            href="#getting-started"
            className="border border-gray-600 hover:border-gray-400 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">Platform Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '📱',
              title: 'Multi-Platform Builds',
              description:
                'Build APKs, AABs for Android, and web bundles from a single codebase. Support for Flutter, native Android, and web projects.',
            },
            {
              icon: '🤖',
              title: 'AI-Powered Generation',
              description:
                'Describe your app and let AI generate the code. Edit files, manage project structure, and iterate with intelligent suggestions.',
            },
            {
              icon: '📦',
              title: 'Artifact Management',
              description:
                'Download built artifacts with signed URLs. Track build history, view logs, and manage versions all in one place.',
            },
            {
              icon: '🔑',
              title: 'API-First Design',
              description:
                'Full REST API with Bearer token authentication. Integrate with any CI/CD pipeline or development workflow.',
            },
            {
              icon: '📊',
              title: 'Usage Analytics',
              description:
                'Track builds, API usage, and resource consumption. Detailed audit logs for compliance and debugging.',
            },
            {
              icon: '⚡',
              title: 'Serverless Architecture',
              description:
                'Built on Next.js with Neon PostgreSQL. Scales automatically with your usage. Deploy anywhere with Vercel or Docker.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-primary-500 transition-colors"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Getting Started Section */}
      <section id="getting-started" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">Getting Started</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          {[
            {
              step: '1',
              title: 'Get Your API Key',
              description: 'Sign up and generate an API key from the dashboard settings page.',
              code: 'curl -X POST https://your-app.vercel.app/api/auth \\\n  -H "Content-Type: application/json" \\\n  -d \'{"email": "you@example.com", "name": "Your Name"}\'',
            },
            {
              step: '2',
              title: 'Create a Project',
              description: 'Create a new project specifying the type (flutter, android, or web).',
              code: 'curl -X POST https://your-app.vercel.app/api/projects \\\n  -H "Authorization: Bearer uab_your_key" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name": "My App", "type": "flutter"}\'',
            },
            {
              step: '3',
              title: 'Build & Download',
              description: 'Start a build and download the compiled artifact.',
              code: 'curl -X POST https://your-app.vercel.app/api/builds \\\n  -H "Authorization: Bearer uab_your_key" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"project_id": "...", "type": "apk"}\'',
            },
          ].map((item) => (
            <div key={item.step} className="flex space-x-6">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center font-bold text-lg">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 mb-4">{item.description}</p>
                <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300">
                  <code>{item.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>Universal AI Builder — Build anything, ship everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
