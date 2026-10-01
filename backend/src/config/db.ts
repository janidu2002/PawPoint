import mongoose from "mongoose";
import dns from "dns";

import { env } from "./env";

const applyDnsServers = (): void => {
  const servers = env.dnsServers;
  if (!servers) return;

  dns.setServers(servers.split(",").map((s) => s.trim()).filter(Boolean));
  console.log(`Using DNS servers: ${dns.getServers().join(", ")}`);
};

const connectDB = async (): Promise<mongoose.Connection> => {
  const uri = env.mongoUri;

  applyDnsServers();

  const { connection } = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  connection.on("error", (err) =>
    console.error(`MongoDB error: ${err.message}`)
  );
  connection.on("disconnected", () =>
    console.warn("MongoDB disconnected")
  );

  console.log(`MongoDB connected: ${connection.host}/${connection.name}`);
  return connection;
};

export default connectDB;