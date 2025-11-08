// src/index.ts
import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

if (MONGO_URI) {
  connectDB(MONGO_URI).catch((err) => {
    console.warn("⚠️ MongoDB connection failed (server kept alive):", err.message || err);
  });
} else {
  console.log("⚠️ No MONGO_URI provided — skipping DB connection.");
}

export default app;