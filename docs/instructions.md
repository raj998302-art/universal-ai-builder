# Usage Instructions

## For AI Agents

### Connecting via MCP

Add this configuration to your AI agent's MCP settings:

```json
{
  "mcpServers": {
    "universal-ai-builder": {
      "transport": {
        "type": "sse",
        "url": "https://universal-ai-builder.vercel.app/api/mcp",
        "headers": {
          "Authorization": "Bearer YOUR_API_KEY"
        }
      }
    }
  }
}
```

### Workflow: Build a Flutter APK

```
1. create_project(name: "my-app", type: "flutter", description: "My Flutter App")
2. write_file(project_id: "xxx", path: "lib/main.dart", content: "...")
3. write_file(project_id: "xxx", path: "pubspec.yaml", content: "...")
4. install_dependencies(project_id: "xxx")
5. build_flutter_apk(project_id: "xxx", options: { mode: "release" })
6. get_build_status(build_id: "yyy")  // Poll until complete
7. list_artifacts(project_id: "xxx")
8. download_artifact(artifact_id: "zzz")  // Returns signed URL
```

### Workflow: Build a Website

```
1. create_project(name: "my-site", type: "web", description: "My Website")
2. write_file(project_id: "xxx", path: "package.json", content: "...")
3. write_file(project_id: "xxx", path: "src/index.tsx", content: "...")
4. install_dependencies(project_id: "xxx")
5. build_website(project_id: "xxx", options: { framework: "nextjs" })
6. get_build_status(build_id: "yyy")
7. download_artifact(artifact_id: "zzz")
```

### Error Recovery

```
1. build_flutter_apk(project_id: "xxx")
2. get_build_status(build_id: "yyy")     // Returns "failed"
3. get_build_logs(build_id: "yyy")       // Read error details
4. edit_file(project_id: "xxx", path: "lib/main.dart", target: "...", replacement: "...")
5. build_flutter_apk(project_id: "xxx")  // Rebuild
```

## For Developers

### Running Locally

```bash
# Clone
git clone https://github.com/raj998302-art/universal-ai-builder.git
cd universal-ai-builder

# Dashboard
cd apps/dashboard
cp .env.example .env.local
# Edit .env.local with your values
npm install
npm run dev
# Open http://localhost:3000

# MCP Server (standalone)
cd services/mcp-server
npm install
npm run dev
# Runs on http://localhost:3001

# Build Orchestrator
cd services/build-orchestrator
npm install
npm run dev
# Runs on http://localhost:3002
```

### Creating an API Key

1. Go to the dashboard at http://localhost:3000
2. Navigate to Settings
3. Click "Create API Key"
4. Copy the key (it won't be shown again)

### Manual API Usage

```bash
# Health check
curl http://localhost:3000/api/health

# List projects
curl -H "Authorization: Bearer YOUR_KEY" http://localhost:3000/api/projects

# Create project
curl -X POST -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"test-app","type":"flutter","description":"Test"}' \
  http://localhost:3000/api/projects
```

## Dashboard Features

- **Projects** — Create, view, and manage application projects
- **Builds** — Monitor build status, view logs, download artifacts
- **Settings** — Manage API keys, view usage statistics
- **Audit Log** — View security-related events
