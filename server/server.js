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

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
