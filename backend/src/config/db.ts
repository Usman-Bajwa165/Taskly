// src/config/db.ts
import mongoose from "mongoose";

const opts = {
  autoIndex: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Use globalThis to be compatible across environments (Node, serverless bundlers, etc)
const g = globalThis as unknown as { _mongoose?: MongooseCache };

if (!g._mongoose) {
  g._mongoose = { conn: null, promise: null };
}

export const connectDB = async (uri: string) => {
  if (!uri) throw new Error("MONGO_URI is required");

  // reuse existing connection if present
  if (g._mongoose!.conn) {
    return g._mongoose!.conn;
  }

  // create a promise once to avoid multiple concurrent connections
  if (!g._mongoose!.promise) {
    g._mongoose!.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        // clear the promise on failure so future attempts can retry
        g._mongoose!.promise = null;
        throw err;
      });
  }

  g._mongoose!.conn = await g._mongoose!.promise;
  return g._mongoose!.conn;
};
