/**
 * Universal AI Builder - Build Orchestrator HTTP Service
 */

import express, { Request, Response } from 'express';
import { config } from './config';
import { orchestrator, BuildJobRequest } from './orchestrator';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Auth middleware for internal communication with Vercel control plane
function authMiddleware(req: Request, res: Response, next: () => void) {
  const secret = process.env.API_SECRET;
  if (!secret) return next();

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-api-secret'];

  if (token !== secret) {
    return res.status(401).json({ error: 'Unauthorized orchestrator access' });
  }
  next();
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    service: 'build-orchestrator',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dockerSocket: config.dockerSocket,
    activeJobs: orchestrator.getAllJobs().filter((j) => j.status === 'building').length,
    config: {
      maxCpus: config.maxCpus,
      maxMemoryMb: config.maxMemoryMb,
      timeoutSeconds: config.buildTimeoutSeconds,
      images: config.images,
    },
  });
});

// Trigger a build
app.post('/builds', authMiddleware, async (req: Request, res: Response) => {
  const { buildId, projectId, type, projectType, files, options } = req.body;
  if (!buildId || !projectId || !type) {
    return res.status(400).json({ error: 'Missing required build parameters: buildId, projectId, type' });
  }

  const jobReq: BuildJobRequest = {
    buildId,
    projectId,
    type,
    projectType: projectType || 'web',
    files,
    options,
  };

  // Run build asynchronously in the background so HTTP call returns immediately
  orchestrator.executeBuild(jobReq).catch((err) => {
    console.error(`[Orchestrator] Error executing build ${buildId}:`, err);
  });

  return res.status(202).json({
    buildId,
    projectId,
    status: 'building',
    message: 'Build job accepted and processing in Docker container',
  });
});

// Get all jobs
app.get('/builds', authMiddleware, (_req: Request, res: Response) => {
  res.json(orchestrator.getAllJobs());
});

// Get specific job status
app.get('/builds/:id', authMiddleware, (req: Request, res: Response) => {
  const job = orchestrator.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Build job not found' });
  res.json(job);
});

// Get job logs
app.get('/builds/:id/logs', authMiddleware, (req: Request, res: Response) => {
  const job = orchestrator.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Build job not found' });
  res.json({ buildId: job.buildId, status: job.status, logs: job.logs });
});

// Get job artifacts
app.get('/builds/:id/artifacts', authMiddleware, (req: Request, res: Response) => {
  const job = orchestrator.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Build job not found' });
  res.json(job.artifacts);
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`[Build Orchestrator] Listening on port ${PORT}`);
  console.log(`[Build Orchestrator] Docker socket: ${config.dockerSocket}`);
});

export default app;
