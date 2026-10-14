const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { request } = require('undici'); 
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database for syncing
const dbPath = path.resolve(__dirname, 'offline_sync.db');
const db = new sqlite3.Database(dbPath);

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
  try {
    const response = await request('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || 'YOUR_KEY'}` 
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3.5-lightning:free',
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
    reply.code(500).send({ success: false, error: 'OpenRouter API failed' });
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
fastify.get('/api/evidence', async (req, reply) => {
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

