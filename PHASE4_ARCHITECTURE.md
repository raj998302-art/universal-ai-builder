# Phase 4 Architecture: Autonomous AI Software Development Engine
**Universal AI App & Website Builder Platform**  
**Document Version:** 4.0.0  
**Status:** Approved for Implementation

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Clients["Clients & External AI Agents"]
        GeminiCLI["Google Gemini CLI / SDK"]
        ChatGPT["ChatGPT (Custom Actions / Remote MCP)"]
        DashboardUI["Dashboard IDE Workspace"]
        ExternalMCP["External MCP Agents (Cursor / Claude)"]
    end

    subgraph ControlPlane["Vercel Serverless Control Plane"]
        MCPGateway["MCP Protocol Gateway (/api/mcp)"]
        RESTAPI["REST API (/api/projects, /api/builds, /api/agent)"]
        OpenAPISpec["OpenAPI 3.1.0 Manifest"]
        
        subgraph AgentEngine["Autonomous AI Agent Engine"]
            Planner["Plan & Spec Synthesizer"]
            Inspector["Workspace Inspector & AST Analyzer"]
            Generator["Code Generation Engine"]
            Executor["Build Dispatcher"]
            Diagnoser["Compiler Log Diagnoser & Auto-Healer"]
        end

        subgraph ProviderSubsystem["AI Provider Architecture"]
            OpenAIProvider["OpenAI / Compatible Endpoint"]
            GeminiProvider["Google Gemini SDK"]
            AnthropicProvider["Anthropic Claude"]
            CustomProvider["Custom Endpoint Engine"]
        end

        subgraph StorageLayer["Multi-Tier Persistence Engine"]
            MemCache["In-Memory LRU Cache"]
            PostgreSQL["Neon PostgreSQL (Tier 1)"]
            GitSync["GitHub Data Tree Persistence (Tier 2)"]
        end
    end

    subgraph BuildWorkers["Cloud Build Workers (GitHub Actions)"]
        FlutterRunner["Flutter Android Runner (SDK 3.24)"]
        KotlinRunner["Native Android Runner (Gradle 8.7, AGP 8.2)"]
        WebRunner["Vite / React Node 20 Runner"]
        ArtifactStore["GitHub Actions / R2 Artifact Store"]
    end

    Clients --> MCPGateway
    Clients --> RESTAPI
    MCPGateway --> AgentEngine
    RESTAPI --> AgentEngine
    AgentEngine --> ProviderSubsystem
    AgentEngine --> StorageLayer
    AgentEngine --> BuildWorkers
    BuildWorkers --> ArtifactStore
    StorageLayer --> PostgreSQL
    StorageLayer --> GitSync
```

---

## 2. Autonomous Agent Execution Loop

The agent executes a disciplined, bounded feedback loop with execution limits:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / External Agent
    participant Agent as Autonomous Agent Engine
    participant Storage as Project Workspace Storage
    participant Worker as Cloud Build Worker
    participant Diagnoser as Error Recovery Diagnoser

    User->>Agent: Natural Language Prompt ("Create Android app with white bg & centered Hello World")
    Agent->>Agent: 1. PLAN: Synthesize specification & select stack (Kotlin / Android)
    Agent->>Storage: 2. INSPECT: Check existing project state (if modifying)
    Agent->>Storage: 3. GENERATE: Scaffold full project files (Gradle, Manifest, Activity)
    Agent->>Worker: 4. EXECUTE: Dispatch cloud build job (build_android_apk)
    Worker-->>Agent: 5. TEST: Return build status (Success or Failure with logs)
    
    alt Build Failed
        Agent->>Diagnoser: 6. DIAGNOSE: Parse compiler logs, pinpoint error line
        Diagnoser->>Storage: 7. FIX: Apply targeted source code patch
        Agent->>Worker: 8. RETEST: Re-trigger build workflow
        Worker-->>Agent: Build status
    end

    Agent-->>User: 9. DELIVER: Return working download link, SHA-256, & live preview
```

---

## 3. Subsystem Specifications

### Subsystem 1: Autonomous Agent Engine (`agent-engine.ts`)
- **State Machine:** `IDLE -> PLANNING -> SCAFFOLDING -> DISPATCHING -> MONITORING -> DIAGNOSING -> PATCHING -> COMPLETED / FAILED`
- **Safety Rails:**
  - `max_iterations`: Default 5, maximum 10 steps per execution.
  - `timeout_ms`: 10 minutes total execution window.
  - Path traversal checks: All file operations constrained within project root.

### Subsystem 2: Native Android Pipeline (`android-generator.ts`)
- **Structure:**
  - `settings.gradle`: Configures repository mirrors and root project name.
  - `build.gradle`: AGP 8.2.2, Kotlin 1.9.22.
  - `app/build.gradle`: Android SDK 34, minSdk 24, Java 17 compatibility.
  - `app/src/main/AndroidManifest.xml`: Configurable application label, package name, activities, permissions.
  - `app/src/main/res/values/`: `strings.xml`, `colors.xml`, `themes.xml`.
  - `app/src/main/java/{package_path}/MainActivity.kt`: Centered layouts, Jetpack Compose or View system.

### Subsystem 3: Website Builder 2.0
- **Routing & Pages:**
  - Multi-tab / multi-page responsive architecture (`Home`, `About`, `Features`, `Contact`).
  - Modular component decomposition (`Navbar`, `Footer`, `ContactForm`, `ThemeToggle`).
  - Production Vite bundling into `dist/`.

### Subsystem 4: Real-Time Project Workspace (`/dashboard/workspace`)
- **Panels:**
  - File Explorer (directory tree, file add/delete/rename).
  - Code Editor (Monaco / syntax styling, line numbers, live edit/save).
  - AI Chat & Agent Monitor (step progress, diff review with Accept/Reject).
  - Live Iframe Preview (`/api/preview/[id]`) with responsive viewport selector.
  - Build Terminal (live logs and status indicator).

### Subsystem 5: Modular AI Provider System
- Interface `AIProvider` supports streaming or standard completions.
- Providers: `OpenAICompatibleProvider`, `GeminiProvider`, `AnthropicProvider`, `CustomProvider`.
- Secure server-side environment variables: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`.
