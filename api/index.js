// api/index.js
// Vercel serverless wrapper for your compiled TypeScript backend.
//
// This file expects your backend TypeScript to be compiled into:
//   backend/dist/src/app.js
//   backend/dist/src/config/db.js
//
// The root package.json build step (below) will produce those files.

const serverless = require('serverless-http');
const path = require('path');

function safeRequire(p) {
  try { return require(p); } catch (e) { console.error('safeRequire error', p, e.message); return null; }
}

const appModule = safeRequire(path.join(__dirname, 'backend', 'dist', 'src', 'app'));
if (!appModule) {
  throw new Error('Could not load backend/dist/src/app. Make sure `npm run build` was run and path exists.');
}
const app = appModule.default || appModule;

// load compiled connectDB helper
const dbModule = safeRequire(path.join(__dirname, 'backend', 'dist', 'src', 'config', 'db'));
const connectDB = (dbModule && (dbModule.connectDB || (dbModule.default && dbModule.default.connectDB)));

let isConnected = false;
async function ensureDB() {
  if (isConnected) return;
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGO_URI/MONGODB_URI provided in env');
    return;
  }
  if (!connectDB) {
    console.error('connectDB function not found in compiled backend.');
    return;
  }
  await connectDB(uri);
  isConnected = true;
}

// lightweight middleware to ensure DB is connected before each request (cold starts)
app.use(async (req, res, next) => {
  try {
    await ensureDB();
    return next();
  } catch (err) {
    console.error('DB connection error (api wrapper):', err);
    return res.status(500).json({ error: 'DB connection error' });
  }
});

module.exports = serverless(app);
