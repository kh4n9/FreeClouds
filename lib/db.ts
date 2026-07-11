import mongoose from "mongoose";
import dns from "dns";
import { env } from "./env";

// Fix Node.js DNS resolution on Windows (ECONNREFUSED for SRV/A queries)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "9.9.9.9", "208.67.222.222"]);
  dns.setDefaultResultOrder("ipv4first");
} catch {}

// Monkey-patch DNS SRV resolution to fall back to custom resolver
// (MongoDB Atlas +srv connections fail on Windows when default DNS can't resolve SRV)
const origResolveSrv = dns.promises.resolveSrv.bind(dns.promises);
dns.promises.resolveSrv = ((hostname: string) => {
  return origResolveSrv(hostname).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ETIMEOUT") {
      const r = new dns.promises.Resolver();
      r.setServers(["8.8.8.8", "1.1.1.1", "9.9.9.9", "208.67.222.222"]);
      return r.resolveSrv(hostname);
    }
    throw err;
  });
}) as typeof dns.promises.resolveSrv;

interface GlobalMongoose {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  var mongoose: GlobalMongoose | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    cached!.promise = mongoose.connect(env.DATABASE_URL, opts).then((mongoose) => {
      console.log("✅ Connected to MongoDB");
      return mongoose.connection;
    }).catch((error) => {
      console.error("❌ MongoDB connection error:", error);
      cached!.promise = null;
      throw error;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached?.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
