// tests/setup.ts
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db";
import dotenv from "dotenv";
dotenv.config();

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  // connect mongoose using our connectDB utility
  await connectDB(uri);
});

afterEach(async () => {
  // clear DB between tests
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  for (const coll of collections) {
    await coll.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
