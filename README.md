# Universal AI Builder

[![Docker Images](https://github.com/raj998302-art/universal-ai-builder/actions/workflows/docker-images.yml/badge.svg)](https://github.com/raj998302-art/universal-ai-builder/actions/workflows/docker-images.yml)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-brightgreen)](https://universal-ai-builder.vercel.app)

**Production-ready infrastructure for AI agents to create, build, and deploy real applications and websites.**

External AI agents (ChatGPT, Claude, Gemini, Cursor, OpenCode, custom MCP-compatible agents) connect to this platform via MCP protocol and use our cloud infrastructure to compile real Flutter APKs, Android apps, and websites.

---

## Architecture

```
AI Agents (ChatGPT, Claude, Gemini, etc.)
         │
         │ MCP Protocol (HTTP + SSE)
         ▼
┌─────────────────────────────────┐
│     Vercel Control Plane        │
│  Dashboard │ API │ MCP Server   │
│         PostgreSQL (Neon)       │
└──────────────┬──────────────────┘
               │ Build Requests
               ▼
┌─────────────────────────────────┐
│      Build Workers (Docker)     │
│  Flutter+Android │ Native │ Web │
└──────────────┬──────────────────┘
               │ Artifacts
               ▼
┌─────────────────────────────────┐
│    S3-Compatible Storage (R2)   │
│    APKs, AABs, ZIPs, Logs      │
└─────────────────────────────────┘
```

## Features

- 🔨 **Real Compilation** — Actual Flutter, Android, and web builds (not simulated)
- 🤖 **MCP Protocol** — Standard protocol for AI agent integration
- 📱 **Flutter APK/AAB** — Compile Flutter apps to Android packages
- 📲 **Native Android** — Build Java/Kotlin Android apps with Gradle
- 🌐 **Web Builds** — Build React, Next.js, Vue, and other web projects
- 🔐 **Secure** — Isolated containers, API key auth, signed download URLs
- 📊 **Dashboard** — Web UI for project management and build monitoring
- 🐳 **Docker Workers** — Reproducible build environments with pinned SDKs

## Quick Start

### For AI Agents (MCP Connection)

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

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `create_project` | Create a new project (flutter/android/web) |
| `list_projects` | List all projects |
| `get_project` | Get project details |
| `write_file` | Create or update a project file |
| `read_file` | Read a project file |
| `edit_file` | Edit part of a file |
| `delete_file` | Delete a project file |
| `install_dependencies` | Install project dependencies |
| `build_flutter_apk` | Build Flutter release APK |
| `build_flutter_aab` | Build Flutter App Bundle |
| `build_android_apk` | Build native Android APK |
| `build_android_aab` | Build native Android AAB |
| `build_website` | Build web project |
| `get_build_status` | Check build job status |
| `get_build_logs` | Get build output logs |
| `list_artifacts` | List build artifacts |
| `download_artifact` | Get signed download URL |

## Project Structure

```
universal-ai-builder/
├── apps/
│   └── dashboard/           # Next.js 14 dashboard + API
├── services/
│   ├── mcp-server/          # MCP server (HTTP + SSE transport)
│   └── build-orchestrator/  # Docker build job orchestrator
├── docker/
│   ├── flutter-android/     # Flutter + Android SDK image
│   ├── native-android/      # Native Android image
│   └── web-builder/         # Node.js web build image
├── .github/
│   └── workflows/           # CI/CD pipelines
├── docs/                    # Documentation
└── README.md
```

## Docker Images

| Image | Contents | Size |
|-------|----------|------|
| `ghcr.io/raj998302-art/universal-ai-builder/flutter-android` | Flutter 3.24, Android SDK 34, JDK 17, Gradle 8 | ~3.5GB |
| `ghcr.io/raj998302-art/universal-ai-builder/native-android` | Android SDK 34, JDK 17, Kotlin, Gradle 8 | ~2GB |
| `ghcr.io/raj998302-art/universal-ai-builder/web-builder` | Node.js 20, pnpm, Bun, Python 3 | ~800MB |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `API_SECRET` | Secret for API key generation | Yes |
| `STORAGE_ENDPOINT` | S3-compatible endpoint (e.g., R2) | Yes |
| `STORAGE_ACCESS_KEY` | Storage access key | Yes |
| `STORAGE_SECRET_KEY` | Storage secret key | Yes |
| `STORAGE_BUCKET` | Storage bucket name | Yes |
| `BUILD_WORKER_URL` | Build orchestrator URL | Yes |
| `GITHUB_TOKEN` | For GHCR image pulls | Optional |

## Development

```bash
# Install dependencies
cd apps/dashboard && npm install

# Run dashboard locally
npm run dev

# Run MCP server locally
cd services/mcp-server && npm install && npm run dev

# Run build orchestrator locally
cd services/build-orchestrator && npm install && npm run dev
```

## Deployment

See [docs/deployment.md](docs/deployment.md) for full deployment instructions.

## Security

See [docs/security.md](docs/security.md) for security architecture and policies.

## License

MIT License - see [LICENSE](LICENSE) file.
