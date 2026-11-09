# Deployment Guide

## Prerequisites

- GitHub account with repository access
- Vercel account
- Neon PostgreSQL account (free tier)
- Cloudflare R2 account (free tier, optional — can use local storage initially)
- Docker host for build workers (VPS or cloud instance)

## Step 1: Database Setup (Neon)

1. Create a Neon account at https://neon.tech
2. Create a new project named `universal-ai-builder`
3. Copy the connection string (DATABASE_URL)
4. Run the schema migration:

```bash
psql $DATABASE_URL < apps/dashboard/src/lib/db/schema.sql
```

## Step 2: Deploy Dashboard to Vercel

1. Connect the GitHub repository to Vercel
2. Set the root directory to `apps/dashboard`
3. Configure environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `API_SECRET` | Random 64-char secret (`openssl rand -hex 32`) |
| `STORAGE_ENDPOINT` | R2 endpoint URL |
| `STORAGE_ACCESS_KEY` | R2 access key |
| `STORAGE_SECRET_KEY` | R2 secret key |
| `STORAGE_BUCKET` | `universal-ai-builder` |
| `BUILD_WORKER_URL` | Build orchestrator URL |

4. Deploy

## Step 3: Build Docker Images

Docker images are built automatically by GitHub Actions on push to `main`.

To build manually:

```bash
# Flutter + Android
docker build -t ghcr.io/raj998302-art/universal-ai-builder/flutter-android:latest -f docker/flutter-android/Dockerfile .

# Native Android
docker build -t ghcr.io/raj998302-art/universal-ai-builder/native-android:latest -f docker/native-android/Dockerfile .

# Web Builder
docker build -t ghcr.io/raj998302-art/universal-ai-builder/web-builder:latest -f docker/web-builder/Dockerfile .
```

## Step 4: Deploy Build Worker

### Option A: VPS with Docker

```bash
# On your VPS
git clone https://github.com/raj998302-art/universal-ai-builder.git
cd universal-ai-builder/services/build-orchestrator
npm install
npm run build

# Set environment variables
export PORT=3002
export API_SECRET=<same secret as Vercel>
export STORAGE_ENDPOINT=<R2 endpoint>
export STORAGE_ACCESS_KEY=<R2 access key>
export STORAGE_SECRET_KEY=<R2 secret key>
export STORAGE_BUCKET=universal-ai-builder
export DOCKER_HOST=unix:///var/run/docker.sock

# Pull builder images
docker pull ghcr.io/raj998302-art/universal-ai-builder/flutter-android:latest
docker pull ghcr.io/raj998302-art/universal-ai-builder/native-android:latest
docker pull ghcr.io/raj998302-art/universal-ai-builder/web-builder:latest

# Start orchestrator
npm start
```

### Option B: Docker Compose

```bash
cd services/build-orchestrator
docker compose up -d
```

## Step 5: Configure MCP Connection

After deployment, the MCP endpoint is available at:

```
https://universal-ai-builder.vercel.app/api/mcp
```

Configure your AI agent:

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

## Step 6: Verify Deployment

```bash
# Health check
curl https://universal-ai-builder.vercel.app/api/health

# Create API key (via dashboard)
# Test MCP connection
# Run a test build
```

## Troubleshooting

### Build fails with "Docker not found"
Ensure Docker is installed and the orchestrator has access to the Docker socket.

### Images fail to pull
Ensure GitHub Container Registry authentication:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u raj998302-art --password-stdin
```

### Database connection fails
Verify DATABASE_URL is correctly set and Neon project is active.
