// src/index.ts
import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";

(async () => {
  try {
    if (MONGO_URI) {
      await connectDB(MONGO_URI);
    } else {
      console.warn("⚠️ No MONGO_URI provided — skipping DB connection.");
    }

    const server = app.listen(Number(PORT), () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });

    // optional: graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down server...");
      server.close(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("Failed to start app:", (err as Error).message || err);
    process.exit(1);
  }
})();
