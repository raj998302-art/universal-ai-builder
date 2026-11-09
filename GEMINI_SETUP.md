# Google Gemini CLI & Agent MCP Integration Guide
**Universal AI App & Website Builder Platform**  
**Endpoint:** `https://universal-ai-builder-nine.vercel.app/api/mcp`  
**Protocol:** Model Context Protocol (MCP) Streamable HTTP Transport (`2024-11-05`)

---

## 1. Official Architecture & Scope

This guide provides verified, production-tested instructions for integrating the Universal AI Builder MCP server with **Google Gemini CLI (`@google/gemini-cli`)** and Gemini Developer SDK agents.

Through this integration, Gemini CLI agents can:
1. **Discover & Inspect:** Introspect all 29 tools via `tools/list`.
2. **Autonomous App Generation:** Generate Flutter apps, Native Kotlin Android apps, and multi-page React/Vite websites.
3. **Workspace File Management:** Read, write, edit, and search source code files.
4. **Cloud Build Execution:** Trigger real cloud build workers on GitHub Actions for Android APK, Android AAB, and Web production bundles.
5. **Log Retrieval & Error Recovery:** Inspect live compiler output and diagnose build failures.
6. **Artifact Downloads:** Retrieve authenticated download links for compiled APKs and ZIP archives.

> [!NOTE]
> **Gemini Web Client vs. Gemini CLI:**  
> The consumer chat interface at `gemini.google.com` does not currently support custom remote MCP servers. Native MCP server connections are supported directly in the official **Gemini CLI (`@google/gemini-cli`)**, **Antigravity CLI (`agy`)**, and the Gemini Developer SDK.

---

## 2. Gemini CLI Configuration (`~/.gemini/settings.json`)

The official Gemini CLI reads its persistent user-level configuration from `~/.gemini/settings.json` (or project-level `.gemini/settings.json`).

### Verified Configuration Schema

Edit `~/.gemini/settings.json` and add the `universal-ai-builder` MCP server:

```json
{
  "mcpServers": {
    "universal-ai-builder": {
      "url": "https://universal-ai-builder-nine.vercel.app/api/mcp",
      "type": "http",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
      },
      "timeout": 15000,
      "trust": true
    }
  }
}
```

### Critical Configuration Fields:
1. **`"type": "http"`:** Specifies Streamable HTTP transport (using JSON-RPC 2.0 over HTTP with pre-flight `HEAD` and `POST` handlers). Do not use `"remote"` or `"sse"`.
2. **`"timeout": 15000`:** Gemini CLI defaults to a 5-second probe timeout (`MCP_LIST_DEFAULT_TIMEOUT_MSEC = 5000`). Because serverless functions on Vercel can take 3–7 seconds during cold start, setting `"timeout": 15000` guarantees reliable connection status without premature timeouts.
3. **`"trust": true`:** Explicitly marks the MCP server as trusted, preventing interactive approval prompts during automated agent execution.

---

## 3. Trusted Workspaces & Security

Gemini CLI restricts MCP server usage inside folders that have not been explicitly trusted.

### Step 1: Trust Your Workspace
To enable MCP servers in your workspace, configure `~/.gemini/trustedFolders.json`:

```json
{
  "/path/to/your/workspace": "TRUST_FOLDER"
}
```

Or set the environment variable in your shell profile (`~/.bashrc` or `~/.zshrc`):
```bash
export GEMINI_CLI_TRUST_WORKSPACE=true
```

### Step 2: Environment Variable Key Management
Never commit raw API keys into git repositories. Set your key securely in your environment:

```bash
# Add to ~/.bashrc or CI environment
export UAB_API_KEY="uab_sec_YOUR_GENERATED_SECRET"
```

In `~/.gemini/settings.json`, you can reference the token or inject it dynamically during CLI startup.

---

## 4. Connection Verification (`gemini mcp list`)

Verify the connection using the official Gemini CLI command:

```bash
gemini mcp list
```

### Verified Output:
```text
Configured MCP servers:

✓ universal-ai-builder: https://universal-ai-builder-nine.vercel.app/api/mcp (http) - Connected
```

The green checkmark (`✓`) and `Connected` status confirm that:
- HTTP `HEAD` protocol probe succeeded with status `200 OK`.
- MCP version headers (`X-MCP-Version: 2.0.0`, `X-MCP-Protocol: 2024-11-05`) were acknowledged.
- Streamable HTTP connection is active.

---

## 5. End-to-End Workflow Verification

Below is the verified 7-step automated workflow executed by Gemini CLI against the live MCP server:

### Step 1: Discover Tools (`tools/list`)
Gemini CLI discovers all 29 tools:
```json
{
  "tools": [
    { "name": "create_project", "description": "Create a new project..." },
    { "name": "list_projects", "description": "List all projects..." },
    { "name": "get_project", "description": "Get detailed project info..." },
    { "name": "read_file", "description": "Read source file content..." },
    { "name": "write_file", "description": "Write or overwrite file..." },
    { "name": "build_website", "description": "Compile production website..." },
    { "name": "get_build_status", "description": "Monitor build progress..." },
    { "name": "download_artifact", "description": "Retrieve download link..." }
  ]
}
```

### Step 2: Execute `list_projects`
```json
{
  "projects": [
    {
      "id": "proj_demo_flutter_001",
      "name": "Flutter Counter Demo",
      "type": "flutter"
    }
  ],
  "count": 1
}
```
> [!IMPORTANT]
> Gemini CLI's `McpComplianceTransport` requires tool results to return a JSON object (record) rather than a naked array to satisfy Zod schema validation on `structuredContent`.

### Step 3: Create Project (`create_project`)
```json
{
  "name": "create_project",
  "arguments": {
    "name": "GeminiCLITestApp",
    "type": "web",
    "description": "Project created via official Gemini CLI integration"
  }
}
```
**Response:**
```json
{
  "id": "proj_2ofmfumM4cuB",
  "name": "GeminiCLITestApp",
  "type": "web",
  "status": "created"
}
```

### Step 4: Write Workspace File (`write_file`)
```json
{
  "name": "write_file",
  "arguments": {
    "project_id": "proj_2ofmfumM4cuB",
    "file_path": "src/gemini-config.json",
    "content": "{\n  \"integration\": \"gemini-cli\",\n  \"status\": \"verified\"\n}"
  }
}
```
**Response:**
```json
{
  "project_id": "proj_2ofmfumM4cuB",
  "file_path": "src/gemini-config.json",
  "size": 65,
  "status": "saved"
}
```

### Step 5: Read File Back (`read_file`)
```json
{
  "name": "read_file",
  "arguments": {
    "project_id": "proj_2ofmfumM4cuB",
    "file_path": "src/gemini-config.json"
  }
}
```
**Response:**
```json
{
  "project_id": "proj_2ofmfumM4cuB",
  "file_path": "src/gemini-config.json",
  "content": "{\n  \"integration\": \"gemini-cli\",\n  \"status\": \"verified\"\n}",
  "size": 65
}
```

### Step 6: Trigger Cloud Build (`build_website`)
```json
{
  "name": "build_website",
  "arguments": {
    "project_id": "proj_2ofmfumM4cuB"
  }
}
```
**Response:**
```json
{
  "build_id": "build_cXUZ-uTBKXfy_5",
  "project_id": "proj_2ofmfumM4cuB",
  "type": "web",
  "status": "building",
  "files_compiled": 1,
  "message": "Build triggered. Monitor status using get_build_status."
}
```

### Step 7: Poll Build Status & Retrieve Artifact
```json
{
  "name": "get_build_status",
  "arguments": {
    "build_id": "build_cXUZ-uTBKXfy_5"
  }
}
```
**Status:** `success`  
**Artifact Download Link:** Authenticated download via `/api/artifacts/{id}`.

---

## 6. Summary of Validation Evidence

| Test Step | Target | Status | Result / Evidence |
| :--- | :--- | :--- | :--- |
| **CLI Settings Audit** | `~/.gemini/settings.json` | ✅ PASS | Configured with `"type": "http"`, `timeout: 15000` |
| **CLI Status Probe** | `gemini mcp list` | ✅ PASS | Output: `✓ universal-ai-builder: ... Connected` |
| **Workspace Trust** | `trustedFolders.json` | ✅ PASS | Workspace trusted without interactive blocks |
| **Tools List** | `tools/list` | ✅ PASS | 29 tools discovered |
| **List Projects** | `list_projects` | ✅ PASS | Structured JSON object validated |
| **Create Project** | `create_project` | ✅ PASS | Project `proj_2ofmfumM4cuB` created |
| **Write File** | `write_file` | ✅ PASS | `src/gemini-config.json` written |
| **Read File** | `read_file` | ✅ PASS | Verified byte-for-byte content matching |
| **Trigger Build** | `build_website` | ✅ PASS | Dispatched cloud build `build_cXUZ-uTBKXfy_5` |
| **Key Hygiene** | Secrets Audit | ✅ PASS | Keys masked in all configuration and documentation |
