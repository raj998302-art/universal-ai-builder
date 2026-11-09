# Architecture Documentation

## System Overview

The Universal AI Builder is a platform that enables AI agents to create, build, and deploy real applications using cloud infrastructure. It follows a microservices architecture with clear separation of concerns.

## Components

### 1. Vercel Control Plane

**Purpose:** Hosts the web dashboard, REST API, and MCP server.

**Technology:** Next.js 14 (App Router), TypeScript, Tailwind CSS

**Responsibilities:**
- User authentication and API key management
- Project CRUD operations
- Build job creation and status tracking
- MCP protocol endpoint for AI agents
- Dashboard UI for monitoring
- Artifact download URL generation

**Deployment:** Vercel Serverless Functions + Edge Runtime

### 2. Build Workers (Docker)

**Purpose:** Execute actual compilation tasks in isolated containers.

**Images:**
- **flutter-android** — Flutter SDK + Android SDK + JDK 17 + Gradle
- **native-android** — Android SDK + JDK 17 + Kotlin + Gradle
- **web-builder** — Node.js 20 + pnpm + Bun + Python 3

**Security Model:**
- Each build runs in an isolated container
- Non-root user inside containers
- CPU/memory/disk/time limits enforced
- No network access during builds (except dependency installation)
- Workspace cleaned after each build

### 3. Build Orchestrator

**Purpose:** Manages the lifecycle of build jobs.

**Technology:** Node.js + Express + Dockerode + Bull (job queue)

**Responsibilities:**
- Accept build requests from the API
- Queue and schedule builds
- Create Docker containers with appropriate images
- Mount source code into containers
- Execute build commands
- Stream and capture logs
- Extract artifacts from containers
- Upload artifacts to storage
- Clean up containers and workspaces

### 4. PostgreSQL Database (Neon)

**Purpose:** Persistent data storage.

**Tables:**
- users — User accounts
- projects — Application projects
- build_jobs — Build job records
- artifacts — Build artifact metadata
- api_keys — API key management
- usage_tracking — Usage metrics
- audit_logs — Security audit trail

### 5. Object Storage (S3-Compatible)

**Purpose:** Store build artifacts.

**Provider:** Cloudflare R2 (or compatible)

**Stored Objects:**
- APK files (Android packages)
- AAB files (Android App Bundles)
- ZIP files (website builds)
- Build log files
- Project exports

## Data Flow

```
1. AI Agent → MCP Server (create_project, write_file, build_flutter_apk)
2. MCP Server → API → Database (create project, store files)
3. API → Build Orchestrator (submit build job)
4. Build Orchestrator → Docker (create container, mount source, execute build)
5. Docker Container → Build Orchestrator (artifacts, logs)
6. Build Orchestrator → Object Storage (upload artifacts)
7. Build Orchestrator → API → Database (update job status, artifact metadata)
8. AI Agent → MCP Server (get_build_status, download_artifact)
9. MCP Server → API → Storage (generate signed download URL)
```

## Security Architecture

See [security.md](security.md) for detailed security documentation.

## Networking

```
Internet ─── Vercel (CDN + Serverless) ─── Neon PostgreSQL
                     │
                     │ HTTPS
                     ▼
              Build Orchestrator ─── Docker Engine
                     │
                     │ S3 API
                     ▼
              Object Storage (R2)
```

## Scalability Considerations

- **Vercel:** Auto-scales serverless functions
- **Build Workers:** Can be scaled horizontally by adding more Docker hosts
- **Database:** Neon auto-scales with connection pooling
- **Storage:** R2 has no egress fees and scales automatically
- **Job Queue:** Bull/BullMQ supports Redis-backed queuing for high throughput
