# Google Gemini CLI & Agent MCP Integration Guide
**Universal AI App & Website Builder Platform**  
**Endpoint:** `https://universal-ai-builder-nine.vercel.app/api/mcp`  
**Protocol:** Model Context Protocol (MCP) Remote HTTP / SSE Transport

---

## 1. Overview & Capabilities

This guide provides step-by-step instructions for integrating the Universal AI Builder MCP server with Google Gemini Developer environments, specifically:
1. **Google Gemini CLI (`@google/gemini-cli` / Gemini Developer SDK)**
2. **Antigravity CLI (`agy`) & Gemini Pair Programming Agents**
3. **Gemini Code Assist / Vertex AI Workbench**

Through this integration, Gemini can directly:
- Generate complete React/Next.js web applications, Flutter mobile apps, and Native Kotlin Android apps.
- Read and modify workspace source files.
- Dispatch real cloud compilation workflows (`flutter build apk`, `flutter build appbundle`, `gradle assembleRelease`, `gradle bundleRelease`).
- Inspect compilation logs and automatically apply fixes to compilation errors.
- Return validated download URLs for compiled Android APKs, AABs, and Web ZIP archives.

> [!WARNING]
> **Consumer Web Client Limitation Notice:**  
> The standard consumer website at `gemini.google.com` does **not** currently support custom third-party remote MCP endpoints or user-installed MCP servers. Custom MCP integration is available through the **Gemini CLI**, **Gemini Code Assist**, and Gemini Developer SDK agents.

---

## 2. Gemini CLI Setup & Configuration

### Option A: Direct Remote HTTP Configuration
In your Gemini CLI configuration directory (typically `~/.gemini/config.json` or `~/.config/gemini/config.json`), register the Universal AI Builder MCP server under the `mcpServers` object:

```json
{
  "mcpServers": {
    "universal-ai-builder": {
      "type": "remote",
      "url": "https://universal-ai-builder-nine.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer uab_live_YOUR_API_KEY",
        "Content-Type": "application/json"
      }
    }
  }
}
```

### Option B: Local Stdio Gateway via `npx @modelcontextprotocol/server-fetch` or Node.js Proxy
If your Gemini CLI build requires a local process with standard I/O (stdio) pipe:

```json
{
  "mcpServers": {
    "universal-ai-builder": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://universal-ai-builder-nine.vercel.app/api/mcp",
        "--header",
        "Authorization: Bearer uab_live_YOUR_API_KEY"
      ]
    }
  }
}
```

### Option C: Antigravity CLI / AGY Configuration
For Antigravity CLI users, add the server to `~/.gemini/antigravity-cli/mcp.json`:

```json
{
  "mcpServers": {
    "universal-builder": {
      "url": "https://universal-ai-builder-nine.vercel.app/api/mcp",
      "transport": "http"
    }
  }
}
```

---

## 3. Environment Variable Security

Never commit your API keys into version control. Store your credentials in your shell environment:

```bash
# Add to ~/.bashrc or ~/.zshrc
export UAB_API_KEY="uab_live_YOUR_GENERATED_KEY"
export UAB_MCP_URL="https://universal-ai-builder-nine.vercel.app/api/mcp"
```

You can then pass the environment variable dynamically in your runner script or CLI session:

```bash
gemini --mcp-server universal-ai-builder="https://universal-ai-builder-nine.vercel.app/api/mcp?auth=$UAB_API_KEY"
```

---

## 4. End-to-End Gemini Command Examples

Once connected, you can interact with Gemini using high-level prompts:

### Example 1: Creating a Flutter Mobile App & Building APK
```
User: "Gemini, create a Flutter cryptocurrency portfolio tracker app named 'CryptoTracker' and compile the release APK."

Gemini Execution Flow:
1. Calls tool: `generate_application`
   - template: "flutter"
   - name: "CryptoTracker"
   - prompt: "Cryptocurrency portfolio tracker with live prices, charts, and dark Material 3 theme"
2. Inspects files using: `list_files`
3. Dispatches cloud runner using: `build_flutter_apk`
   - projectId: "crypto_tracker"
   - buildType: "release"
4. Polls `get_build_status` until status = "success"
5. Calls: `download_artifact`
6. Output to user:
   "Your Flutter APK is ready:
   - File: app-release.apk
   - Size: 18.2 MB
   - SHA-256: 7d1f2a...
   - Download URL: https://universal-ai-builder-nine.vercel.app/api/download/..."
```

### Example 2: Creating a Modern Next.js/React Landing Page
```
User: "Gemini, create a modern SaaS landing page for an AI copywriting tool with a pricing calculator and preview it."

Gemini Execution Flow:
1. Calls tool: `generate_website`
   - template: "react"
   - name: "CopyAI"
   - prompt: "Modern SaaS landing page with dark glassmorphic design and pricing calculator"
2. Calls tool: `build_website`
   - projectId: "copy_ai"
   - exportFormat: "zip"
3. Output to user:
   "Your website has been generated and built:
   - Live Sandbox Preview: https://universal-ai-builder-nine.vercel.app/api/preview/copy_ai
   - Download ZIP: https://universal-ai-builder-nine.vercel.app/api/download/..."
```

---

## 5. Transport Compatibility Matrix & Limitations

| Transport Type | Supported | Notes |
| :--- | :---: | :--- |
| **HTTP POST (JSON-RPC 2.0)** | ✅ Yes | Fully supported; compatible with Gemini CLI remote HTTP connectors. |
| **Server-Sent Events (SSE)** | ✅ Yes | Supported via `GET /api/mcp` and `Accept: text/event-stream`. |
| **Local Stdio Proxy** | ✅ Yes | Bridged using `mcp-remote` or Node.js bridge. |
| **Google Gemini Web App (`gemini.google.com`)** | ❌ No | Consumer web UI does not allow third-party remote MCP endpoints. |

---

## 6. Verification Checklist

To confirm your Gemini CLI setup is operational:
1. Run `gemini mcp list` or inspect available tools. Confirm all **29 tools** appear.
2. Run `gemini mcp call universal-ai-builder list_projects` to verify connectivity.
3. If any connection timeout occurs, check network access to `universal-ai-builder-nine.vercel.app`.
