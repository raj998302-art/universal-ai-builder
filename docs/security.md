# Security Documentation

## Authentication

### API Keys
- All API and MCP endpoints require authentication via API key
- Keys are hashed (SHA-256) before storage — plaintext keys are never stored
- Keys have configurable permissions and expiration dates
- Key usage is tracked with timestamps

### Request Authentication
```
Authorization: Bearer <api_key>
```

## Build Isolation

### Container Security
- Each build runs in a **separate Docker container**
- Containers run as **non-root user** (`builder`, UID 1000)
- **No privileged mode** — containers cannot access host devices
- **Read-only root filesystem** where possible
- **No Docker socket access** — containers cannot create other containers

### Resource Limits
| Resource | Limit | Rationale |
|----------|-------|-----------|
| CPU | 2 cores | Prevent CPU starvation |
| Memory | 4GB | Sufficient for most builds |
| Disk | 10GB | Prevent disk exhaustion |
| Build time | 30 minutes | Prevent runaway builds |
| Network | Restricted | Only during dependency install |

### Workspace Isolation
- Each build gets a unique workspace directory
- Workspaces are cleaned up after build completion
- No cross-user filesystem access
- Path traversal prevention on all file operations

## Input Validation

### Command Injection Prevention
- Build commands are constructed from validated parameters, never from raw user input
- No shell expansion or interpolation of user-provided strings
- Allowlisted build commands only

### Path Traversal Prevention
- All file paths are normalized and validated
- Paths must be within project workspace
- Symlinks are not followed outside workspace
- Dot-dot sequences are rejected

### SSRF Prevention
- Build containers have restricted network access
- DNS resolution restricted to known registries
- Internal service endpoints not accessible from containers

## Data Protection

### Credentials
- GitHub and Vercel tokens stored only in environment variables
- Never committed to source code
- Never exposed to frontend or API responses
- Minimum-permission tokens used

### Artifact Security
- Download URLs are signed with expiration (default: 1 hour)
- URLs include user authorization check
- Artifacts are associated with specific users and projects
- Artifacts are deleted after configurable retention period

## Audit Logging

All significant actions are logged:
- User authentication (success/failure)
- Project creation/modification/deletion
- Build job creation and status changes
- File operations
- Artifact downloads
- API key creation/revocation

Logs include:
- Timestamp
- User ID
- Action type
- Resource type and ID
- IP address
- Request metadata

## Quotas and Rate Limiting

| Resource | Free Tier Limit |
|----------|----------------|
| Projects | 10 per user |
| Builds per day | 20 |
| Storage | 1GB per user |
| Concurrent builds | 2 |
| API requests per minute | 60 |

## Network Security

- All external communication over HTTPS/TLS
- Database connections use SSL
- Storage API calls use HTTPS
- No unencrypted data in transit
