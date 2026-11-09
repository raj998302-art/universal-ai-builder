# Phase 3 Audit: Universal AI Builder Infrastructure & Architecture

**Date:** 2026-11-09T08:21:00Z  
**Auditor:** Principal Software Architect & DevOps Lead  
**Scope:** Control Plane, Build Workers, MCP Protocol, Database & Persistence, AI Code Generation, and Integrations

---

## 1. Executive Summary & Existing Assets

Phase 2 successfully verified the real compilation pipeline for release Android APKs and Web archives over the Model Context Protocol (MCP). The purpose of Phase 3 is to elevate this infrastructure into a full-scale, AI-powered application builder platform with direct ChatGPT and Gemini CLI integrations.

### Current Inventory
- **GitHub Repository:** [`raj998302-art/universal-ai-builder`](https://github.com/raj998302-art/universal-ai-builder) (Branch: `main`)
- **Production URL:** [`https://universal-ai-builder-nine.vercel.app`](https://universal-ai-builder-nine.vercel.app)
- **Live MCP Endpoint:** [`https://universal-ai-builder-nine.vercel.app/api/mcp`](https://universal-ai-builder-nine.vercel.app/api/mcp)
- **Health Check:** [`https://universal-ai-builder-nine.vercel.app/api/health`](https://universal-ai-builder-nine.vercel.app/api/health)
- **Docker Images (GHCR):**
  - `ghcr.io/raj998302-art/universal-ai-builder/web-builder:latest`
  - `ghcr.io/raj998302-art/universal-ai-builder/flutter-android:latest`
  - `ghcr.io/raj998302-art/universal-ai-builder/native-android:latest`
- **Cloud Build Workers:** GitHub Actions workflow `.github/workflows/build-worker.yml` (dispatches on-demand container jobs for Flutter, Kotlin, and Web).

---

## 2. Technical Audit by Subsystem

### A. MCP Endpoint & Protocol Transport
- **Current Support:** Supports JSON-RPC 2.0 over HTTP `POST` and Server-Sent Events (SSE) via `GET` (`Accept: text/event-stream`).
- **Tools Currently Registered (18):**
  - Project tools: `create_project`, `list_projects`, `get_project`.
  - File tools: `read_file`, `write_file`, `edit_file`, `delete_file`.
  - Build tools: `install_dependencies`, `start_build`, `build_flutter_apk`, `build_flutter_aab`, `build_android_apk`, `build_android_aab`, `build_website`, `get_build_status`, `get_build_logs`, `list_artifacts`, `download_artifact`.
- **Gaps for Phase 3:**
  1. Need to implement 10 additional MCP operations requested for complete AI development:
     - Project: `delete_project`, `clone_project`.
     - File: `list_files`, `search_files`.
     - AI development: `generate_application`, `generate_website`, `modify_application`, `explain_project`, `analyze_project`, `fix_build_errors`.
     - Build: `cancel_build`.
     - Total: **28 fully connected tools**.
  2. ChatGPT compatibility: Needs full schema documentation, OAuth 2.1 metadata endpoint (`/.well-known/oauth-authorization-server` or `/api/mcp/oauth`), and Streamable HTTP transport compliance.
  3. Gemini CLI compatibility: Needs remote MCP HTTP/SSE transport configuration and automated test suite.

### B. Database & State Persistence
- **Current State:** Dual-mode implementation. When `DATABASE_URL` is configured, it executes SQL queries against Neon PostgreSQL via `@neondatabase/serverless`. When `DATABASE_URL` is unset, it falls back to in-memory `Map` objects.
- **Serverless Limitation:** In-memory state does not persist across cold-starts or multi-region lambda invocations.
- **Phase 3 Solution:**
  1. Automatic PostgreSQL connection with auto-migrated schema whenever `DATABASE_URL` is set.
  2. Persistent GitHub-backed storage adapter (`data` sync branch/directory) when `DATABASE_URL` is not provided, ensuring projects, files, and build history survive serverless cold starts.

### C. Website Generation & Preview Mechanism
- **Current State:** Generates minimal package and dist files.
- **Phase 3 Requirement:**
  1. Implement `generate_website` to output comprehensive multi-page React or Next.js code with responsive CSS, components, and assets.
  2. Add an interactive website preview mechanism (rendered live in an iframe via `/api/preview/[id]`) so users can test and interact with the site before downloading.

### D. Android AAB (App Bundle) Pipelines
- **Current State:** Workflows for `build_flutter_aab` and `build_android_aab` are defined in `.github/workflows/build-worker.yml`.
- **Phase 3 Requirement:**
  1. Trigger real Flutter AAB and Native Kotlin AAB builds through MCP.
  2. Retrieve and download `.aab` artifacts.
  3. Verify AAB internal structures (`base/manifest/AndroidManifest.xml`, `base/dex/classes.dex`, `bundle-metadata`).

### E. Dashboard & User Interface
- **Current State:** Minimal skeleton with landing page and simple project list.
- **Phase 3 Requirement:**
  Build a complete, responsive dark glassmorphic interface featuring:
  - Dashboard overview with system status and quick actions
  - New Project creation modal/page
  - Project File Explorer and Code Editor
  - AI Builder Workspace (natural language prompt to full source tree)
  - Live Website Preview
  - Android Build Center (APK & AAB management)
  - Build History & live log viewer
  - Artifact Downloads table with hashes
  - MCP Connections page (ChatGPT, Gemini CLI, Claude, Cursor setup)
  - API Key management (generation, revocation)

---

## 3. Risk Assessment & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Serverless instance termination losing files | High | GitHub-backed persistence layer + PostgreSQL fallback |
| Upstream Gradle distribution 504 timeouts | High | Tencent Cloud Gradle distribution mirror fallback (already verified in Phase 2) |
| Missing external credentials (Neon / R2) | Medium | Seamless dual-mode fallback with documented connection instructions |
| Secrets leakage in git or client logs | Critical | Automated redaction, sanitized environment variables, strict no-commit policy |

---

## 4. Phase 3 Action Plan

1. **Architecture & Design:** Write `PHASE3_ARCHITECTURE.md`.
2. **Database & Persistence:** Implement persistent storage adapter supporting PostgreSQL and GitHub data sync.
3. **MCP Tool Expansion:** Expand toolset to all 28 operations in `apps/dashboard/src/app/api/mcp/route.ts`.
4. **Website Builder & Preview:** Add real React/HTML generation and preview route `/api/preview/[id]`.
5. **Dashboard Development:** Create all required pages with responsive glassmorphism UI.
6. **AAB Compilation:** Run end-to-end tests for Flutter AAB and Kotlin AAB.
7. **ChatGPT & Gemini Integration:** Generate configurations, test suites, and documentation.
8. **Deployment & Verification:** Deploy to Vercel and verify all features live.
