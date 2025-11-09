// api/index.js
// Robust Vercel serverless wrapper for the compiled TypeScript backend.
// Tries multiple paths and prints clear errors to logs so we can debug easily.

const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

function tryRequire(p) {
  try {
    const resolved = require.resolve(p);
    console.log('[api wrapper] require.resolve ->', resolved);
    return require(p);
  } catch (err) {
    console.warn('[api wrapper] require failed for', p, '-', err && err.message);
    return null;
  }
}

function findAppModule() {
  const candidates = [
    // Common locations relative to this file inside Vercel function runtime
    path.join(__dirname, '..', 'backend', 'dist', 'src', 'app'),
    path.join(__dirname, 'backend', 'dist', 'src', 'app'),
    path.join(process.cwd(), 'backend', 'dist', 'src', 'app'),
    path.join(process.cwd(), 'dist', 'src', 'app'), // in case build outputs to root/dist
    path.join(process.cwd(), 'backend', 'dist', 'app'),
  ];

  for (const p of candidates) {
    try {
      // check if the file exists with .js extension
      const jsPath = p.endsWith('.js') ? p : p + '.js';
      if (fs.existsSync(jsPath)) {
        console.log('[api wrapper] found compiled app at', jsPath);
        const mod = tryRequire(jsPath);
        if (mod) return mod;
      } else {
        // try resolving module (some bundlers allow requiring without .js)
        const mod = tryRequire(p);
        if (mod) return mod;
      }
    } catch (e) {
      console.warn('[api wrapper] error probing', p, e && e.message);
    }
  }

  return null;
}

const appModule = findAppModule();
if (!appModule) {
  console.error('[api wrapper] Could not find compiled backend module in any candidate path.');
  // throw an error so Vercel function logs contain stack trace
  throw new Error('Compiled backend not found under backend/dist/src/app.js — ensure backend build ran and output is included.');
}

const app = appModule.default || appModule;

// Try to load compiled DB helper
let connectDB = null;
try {
  const dbCandidates = [
    path.join(__dirname, '..', 'backend', 'dist', 'src', 'config', 'db'),
    path.join(process.cwd(), 'backend', 'dist', 'src', 'config', 'db'),
    path.join(process.cwd(), 'backend', 'dist', 'config', 'db')
  ];
  for (const p of dbCandidates) {
    try {
      const jsPath = p.endsWith('.js') ? p : p + '.js';
      if (fs.existsSync(jsPath)) {
        const dbMod = require(jsPath);
        connectDB = dbMod.connectDB || dbMod.default?.connectDB || null;
        if (connectDB) {
          console.log('[api wrapper] found connectDB at', jsPath);
          break;
        }
      } else {
        const dbMod = tryRequire(p);
        if (dbMod) {
          connectDB = dbMod.connectDB || dbMod.default?.connectDB || null;
          if (connectDB) {
            console.log('[api wrapper] found connectDB via require', p);
            break;
          }
        }
      }
    } catch (e) {
      console.warn('[api wrapper] db probe error', p, e && e.message);
    }
  }
} catch (e) {
  console.warn('[api wrapper] error while locating db module', e && e.message);
}

let isConnected = false;
async function ensureDB() {
  if (isConnected) return;
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[api wrapper] No MONGO_URI provided in env');
    return;
  }
  if (!connectDB) {
    console.warn('[api wrapper] connectDB function not found in compiled backend; continuing without explicit connect.');
    return;
  }
  console.log('[api wrapper] attempting to connect to MongoDB via compiled connectDB');
  await connectDB(uri);
  isConnected = true;
}

app.use(async (req, res, next) => {
  try {
    await ensureDB();
    return next();
  } catch (err) {
    console.error('[api wrapper] DB connect error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'DB connection error' });
  }
});

module.exports = serverless(app);
