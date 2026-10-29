const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { request } = require('undici');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Initialize database for syncing
const dbPath = path.resolve(__dirname, 'offline_sync.db');
const db = new sqlite3.Database(dbPath);

// Pipeline directories
const PIPELINE_WORK_DIR = path.resolve(__dirname, '../aasha-pipeline-with-master-json/work');
const PIPELINE_JOBS_DIR = path.resolve(__dirname, '../aasha-pipeline-with-master-json/jobs');

fastify.register(cors, { origin: '*' });

// Setup database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS student_sync_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    chapter_id TEXT,
    payload TEXT,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // AIOS V2: Evidence Ledger (SQLite Authoritative Local Storage — primary offline execution plane)
  db.run(`CREATE TABLE IF NOT EXISTS evidence_ledger (
    task_id        TEXT PRIMARY KEY,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    objective      TEXT NOT NULL,
    repository_state TEXT,
    plan           TEXT,
    agents_used    TEXT,
    harness_used   TEXT,
    tools_used     TEXT,
    files_changed  TEXT,
    tests_run      TEXT,
    test_results   TEXT,
    risks          TEXT,
    decisions      TEXT,
    rollback_plan  TEXT,
    final_status   TEXT NOT NULL DEFAULT 'PLANNED'
      CHECK(final_status IN ('PLANNED','RUNNING','BLOCKED','FAILED','VERIFIED','HIL_REQUIRED','COMPLETE'))
  )`);

  // Pipeline jobs registry cache
  db.run(`CREATE TABLE IF NOT EXISTS pipeline_jobs (
    id TEXT PRIMARY KEY,
    status TEXT,
    subject TEXT,
    grade INTEGER,
    mode TEXT,
    quarantined INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});


/**
 * POST /api/sync
 * Receives batched scores and progress from tablets when they come online.
 */
fastify.post('/api/sync', async (req, reply) => {
  const { student_id, chapter_id, payload } = req.body;
  
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO student_sync_data (student_id, chapter_id, payload) VALUES (?, ?, ?)');
    stmt.run(student_id, chapter_id, JSON.stringify(payload), function(err) {
      if (err) {
        fastify.log.error(err);
        return reject(reply.code(500).send({ success: false, error: 'Database error' }));
      }
      resolve(reply.send({ success: true, message: 'Sync successful', recordId: this.lastID }));
    });
    stmt.finalize();
  });
});

/**
 * POST /api/generate/math
 * Routes math textbook parsing to NuminaMath-7B-TIR.
 */
fastify.post('/api/generate/math', async (req, reply) => {
  const { text, learning_objective } = req.body;
  try {
    const response = await request('http://localhost:8000/v1/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'NuminaMath-7B-TIR',
        prompt: `Parse this math problem and output PIE JSON config.\nText: ${text}\nObjective: ${learning_objective}`,
        max_tokens: 1024
      })
    });
    const data = await response.body.json();
    return { success: true, ai_output: data };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ success: false, error: 'NuminaMath API failed' });
  }
});

/**
 * POST /api/generate/humanities
 * Routes non-math subjects to OpenRouter (Claude/GPT) for H5P Gamified JSON generation.
 */
fastify.post('/api/generate/humanities', async (req, reply) => {
  const { text, template_type } = req.body;
  const is9Router = (process.env.DEFAULT_LLM_PROVIDER || '9router') === '9router';
  const targetUrl = is9Router
    ? `${process.env.NINEROUTER_BASE_URL || 'http://localhost:20128/v1'}/chat/completions`
    : 'https://openrouter.ai/api/v1/chat/completions';
  const rawAuth = is9Router ? process.env.NINEROUTER_API_KEY : process.env.OPENROUTER_API_KEY;
  const authToken = (rawAuth && !rawAuth.includes('YOUR_') && !rawAuth.toLowerCase().includes('placeholder'))
    ? rawAuth.trim()
    : '';
  const targetModel = is9Router
    ? (process.env.NINEROUTER_DEFAULT_MODEL || 'claude-combo')
    : 'nvidia/nemotron-3.5-lightning:free';

  try {
    const response = await request(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'system', content: `You are an AI generating gamified JSON for H5P. Template: ${template_type}.` },
          { role: 'user', content: `Extract entities from this textbook text and output JSON: ${text}` }
        ]
      })
    });
    const data = await response.body.json();
    return { success: true, ai_output: data };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ success: false, error: 'LLM Generation failed' });
  }
});

/**
 * POST /api/evidence
 * AIOS V2: Record an evidence ledger entry (SQLite fallback path).
 * Primary path: hatchable PostgreSQL via evidence_client.ts.
 */
fastify.post('/api/evidence', async (req, reply) => {
  const entry = req.body;
  if (!entry.task_id || !entry.objective || !entry.final_status) {
    return reply.code(400).send({ success: false, error: 'task_id, objective, final_status required' });
  }
  const validStatuses = ['PLANNED','RUNNING','BLOCKED','FAILED','VERIFIED','HIL_REQUIRED','COMPLETE'];
  if (!validStatuses.includes(entry.final_status)) {
    return reply.code(400).send({ success: false, error: `final_status must be one of: ${validStatuses.join(', ')}` });
  }
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO evidence_ledger
        (task_id, objective, repository_state, plan, agents_used, harness_used,
         tools_used, files_changed, tests_run, test_results, risks, decisions,
         rollback_plan, final_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.task_id, entry.objective,
        JSON.stringify(entry.repository_state ?? {}),
        entry.plan ?? '', JSON.stringify(entry.agents_used ?? []),
        entry.harness_used ?? 'antigravity',
        JSON.stringify(entry.tools_used ?? []),
        JSON.stringify(entry.files_changed ?? []),
        JSON.stringify(entry.tests_run ?? []),
        JSON.stringify(entry.test_results ?? {}),
        entry.risks ?? '', entry.decisions ?? '',
        entry.rollback_plan ?? '', entry.final_status,
      ],
      function(err) {
        if (err) {
          fastify.log.error(err);
          return reject(reply.code(500).send({ success: false, error: 'DB error' }));
        }
        resolve(reply.send({ success: true, task_id: entry.task_id }));
      }
    );
  });
});

/**
 * GET /api/evidence/:task_id
 * Retrieve a specific evidence ledger entry.
 */
fastify.get('/api/evidence/:task_id', async (req, reply) => {
  const { task_id } = req.params;
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM evidence_ledger WHERE task_id = ?', [task_id], (err, row) => {
      if (err) return reject(reply.code(500).send({ success: false, error: 'DB error' }));
      if (!row) return resolve(reply.code(404).send({ success: false, error: 'Not found' }));
      resolve(reply.send({ success: true, entry: row }));
    });
  });
});

/**
 * GET /api/evidence
 * List evidence ledger entries (most recent first, limit 50).
 */
fastify.get('/api/evidence', async (_req, reply) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT task_id, objective, final_status, harness_used, created_at FROM evidence_ledger ORDER BY created_at DESC LIMIT 50',
      [],
      (err, rows) => {
        if (err) return reject(reply.code(500).send({ success: false, error: 'DB error' }));
        resolve(reply.send({ success: true, count: rows.length, entries: rows }));
      }
    );
  });
});

// =========================================================================
// AIOS Phase 5: Studio UI & Multi-Agent TUI Control Plane & State Sync API
// =========================================================================

function getJobWorkDir(jobId) {
  const safeId = path.basename(jobId);
  return path.join(PIPELINE_WORK_DIR, safeId);
}

function getJobFile(jobId) {
  const safeId = path.basename(jobId);
  return path.join(PIPELINE_JOBS_DIR, `${safeId}.json`);
}

/**
 * GET /api/jobs
 * List all pipeline jobs from work/ and jobs/ directories.
 */
fastify.get('/api/jobs', async (_req, _reply) => {
  const jobMap = new Map();

  // 1. Scan jobs/ directory
  if (fs.existsSync(PIPELINE_JOBS_DIR)) {
    try {
      const files = fs.readdirSync(PIPELINE_JOBS_DIR);
      for (const file of files) {
        if (file.endsWith('.json') && !file.startsWith('.')) {
          const jobId = file.replace('.json', '');
          try {
            const raw = fs.readFileSync(path.join(PIPELINE_JOBS_DIR, file), 'utf-8');
            const data = JSON.parse(raw);
            jobMap.set(jobId, data);
          } catch {}
        }
      }
    } catch (e) {
      fastify.log.warn(`Could not read PIPELINE_JOBS_DIR: ${e.message}`);
    }
  }

  // 2. Scan work/ directory for live or work-dir job.json
  if (fs.existsSync(PIPELINE_WORK_DIR)) {
    try {
      const dirs = fs.readdirSync(PIPELINE_WORK_DIR);
      for (const dir of dirs) {
        const jobJsonPath = path.join(PIPELINE_WORK_DIR, dir, 'job.json');
        if (fs.existsSync(jobJsonPath)) {
          try {
            const raw = fs.readFileSync(jobJsonPath, 'utf-8');
            const data = JSON.parse(raw);
            const id = data.id || dir;
            jobMap.set(id, { ...(jobMap.get(id) || {}), ...data });
          } catch {}
        }
      }
    } catch (e) {
      fastify.log.warn(`Could not read PIPELINE_WORK_DIR: ${e.message}`);
    }
  }

  const jobsList = Array.from(jobMap.values()).map(job => {
    const workDir = getJobWorkDir(job.id);
    const hasQuarantine = fs.existsSync(path.join(workDir, 'quarantine_packet.json'));
    const hasApproval = fs.existsSync(path.join(workDir, 'intervention_approval.json'));
    const isQuarantined = !!(job.quarantined || hasQuarantine);

    return {
      id: job.id,
      status: job.status || 'unknown',
      quarantined: isQuarantined,
      quarantine_packet: job.quarantine_packet || null,
      intervention_approved: hasApproval,
      subject: job.input?.subject || 'math',
      grade: job.input?.grade || 8,
      mode: job.input?.mode || 'v5-engine',
      cost_usd: job.cost_usd || 0.0,
      created_at: job.created_at || null,
      updated_at: job.updated_at || job.created_at || null,
      stages: job.stages || [],
      outputs: job.outputs || {},
      error_stage: job.error_stage || null,
      error_message: job.error_message || null
    };
  });

  // Sort newest first
  jobsList.sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return { success: true, count: jobsList.length, jobs: jobsList };
});

/**
 * GET /api/jobs/:id
 * Retrieve detailed status of a specific job.
 */
fastify.get('/api/jobs/:id', async (req, reply) => {
  const { id } = req.params;
  const workDir = getJobWorkDir(id);
  const jobFile = getJobFile(id);
  const workJobFile = path.join(workDir, 'job.json');

  let jobData = null;
  if (fs.existsSync(workJobFile)) {
    try {
      jobData = JSON.parse(fs.readFileSync(workJobFile, 'utf-8'));
    } catch {}
  } else if (fs.existsSync(jobFile)) {
    try {
      jobData = JSON.parse(fs.readFileSync(jobFile, 'utf-8'));
    } catch {}
  }

  if (!jobData) {
    return reply.code(404).send({ success: false, error: `Job '${id}' not found` });
  }

  const hasQuarantine = fs.existsSync(path.join(workDir, 'quarantine_packet.json'));
  const hasControl = fs.existsSync(path.join(workDir, 'control.json'));
  const hasInterventionApproval = fs.existsSync(path.join(workDir, 'intervention_approval.json'));

  let controlSignal = null;
  if (hasControl) {
    try {
      controlSignal = JSON.parse(fs.readFileSync(path.join(workDir, 'control.json'), 'utf-8'));
    } catch {}
  }

  let quarantinePacket = jobData.quarantine_packet || null;
  if (!quarantinePacket && hasQuarantine) {
    try {
      quarantinePacket = JSON.parse(fs.readFileSync(path.join(workDir, 'quarantine_packet.json'), 'utf-8'));
    } catch {}
  }

  return {
    success: true,
    job: {
      ...jobData,
      quarantined: !!(jobData.quarantined || hasQuarantine),
      quarantine_packet: quarantinePacket
    },
    flags: {
      hasQuarantine,
      hasControl,
      hasInterventionApproval
    },
    active_control: controlSignal
  };
});

/**
 * GET /api/jobs/:id/quarantine
 * Inspect the diagnostic quarantine packet for a quarantined job.
 */
fastify.get('/api/jobs/:id/quarantine', async (req, reply) => {
  const { id } = req.params;
  const workDir = getJobWorkDir(id);
  const qPath = path.join(workDir, 'quarantine_packet.json');

  if (fs.existsSync(qPath)) {
    try {
      const packet = JSON.parse(fs.readFileSync(qPath, 'utf-8'));
      return { success: true, job_id: id, quarantine_packet: packet };
    } catch (e) {
      return reply.code(500).send({ success: false, error: `Failed to read quarantine packet: ${e.message}` });
    }
  }

  // Fallback to job.json
  const workJobFile = path.join(workDir, 'job.json');
  const jobFile = getJobFile(id);
  let jobData = null;
  if (fs.existsSync(workJobFile)) {
    try { jobData = JSON.parse(fs.readFileSync(workJobFile, 'utf-8')); } catch {}
  } else if (fs.existsSync(jobFile)) {
    try { jobData = JSON.parse(fs.readFileSync(jobFile, 'utf-8')); } catch {}
  }

  if (jobData?.quarantine_packet) {
    return { success: true, job_id: id, quarantine_packet: jobData.quarantine_packet };
  }

  return reply.code(404).send({ success: false, error: `Job '${id}' is not in quarantine` });
});

/**
 * POST /api/jobs/:id/control
 * Dispatch a control signal (pause, resume, approve_intervention, abort) to the running pipeline.
 */
fastify.post('/api/jobs/:id/control', async (req, reply) => {
  const { id } = req.params;
  const { action, issuer = 'api_user', reason = '', payload = {} } = req.body || {};

  const validActions = ['pause', 'resume', 'approve_intervention', 'abort'];
  if (!validActions.includes(action)) {
    return reply.code(400).send({
      success: false,
      error: `Invalid action '${action}'. Allowed actions: ${validActions.join(', ')}`
    });
  }

  const workDir = getJobWorkDir(id);
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
  }

  const controlPath = path.join(workDir, 'control.json');
  const controlData = {
    action,
    issuer,
    timestamp: new Date().toISOString(),
    status: 'pending',
    reason,
    payload
  };

  fs.writeFileSync(controlPath, JSON.stringify(controlData, null, 2), 'utf-8');

  // If approving human intervention, write intervention_approval.json and update evidence ledger
  if (action === 'approve_intervention') {
    const approvalRecord = {
      approved: true,
      approved_by: issuer,
      reason: reason || 'Human intervention approved override via API',
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(path.join(workDir, 'intervention_approval.json'), JSON.stringify(approvalRecord, null, 2), 'utf-8');

    // Update or insert into evidence ledger
    db.run(
      `INSERT OR REPLACE INTO evidence_ledger
        (task_id, objective, plan, final_status, decisions, harness_used)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `hil_override_${id}`,
        `Human intervention approval for pipeline job ${id}`,
        `Super Admin educator override of quarantine block`,
        'VERIFIED',
        JSON.stringify({ issuer, reason, timestamp: approvalRecord.timestamp }),
        'fastify_control_plane'
      ],
      () => {}
    );
  } else if (action === 'abort') {
    db.run(
      `INSERT OR REPLACE INTO evidence_ledger
        (task_id, objective, plan, final_status, harness_used)
       VALUES (?, ?, ?, ?, ?)`,
      [
        `abort_${id}`,
        `Pipeline abort for job ${id}`,
        `Pipeline aborted by ${issuer}: ${reason}`,
        'FAILED',
        'fastify_control_plane'
      ],
      () => {}
    );
  }

  return {
    success: true,
    message: `Control action '${action}' dispatched successfully`,
    job_id: id,
    action,
    timestamp: controlData.timestamp
  };
});

/**
 * GET /api/jobs/:id/events
 * Server-Sent Events (SSE) streaming endpoint for live job bus messages.
 */
fastify.get('/api/jobs/:id/events', async (req, reply) => {
  const { id } = req.params;
  const workDir = getJobWorkDir(id);
  const messagesFile = path.join(workDir, 'messages.jsonl');

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  reply.raw.write(': connected\n\n');

  let sentLineCount = 0;

  const streamNewLines = () => {
    if (!fs.existsSync(messagesFile)) return;
    try {
      const content = fs.readFileSync(messagesFile, 'utf-8');
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      while (sentLineCount < lines.length) {
        const line = lines[sentLineCount++];
        reply.raw.write(`event: message\ndata: ${line}\n\n`);
      }
    } catch {}
  };

  // Immediate catch-up
  streamNewLines();

  // Polling interval
  const pollTimer = setInterval(streamNewLines, 300);

  // Keep-alive heartbeat ping
  const pingTimer = setInterval(() => {
    try {
      reply.raw.write(': ping\n\n');
    } catch {}
  }, 15000);

  req.raw.on('close', () => {
    clearInterval(pollTimer);
    clearInterval(pingTimer);
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = { fastify, db };

