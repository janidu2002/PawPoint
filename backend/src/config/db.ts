import mongoose from "mongoose";
import dns from "dns";

const applyDnsServers = (): void => {
  const servers = process.env.DNS_SERVERS;
  if (!servers) return;

  dns.setServers(servers.split(",").map((s) => s.trim()).filter(Boolean));
  console.log(`Using DNS servers: ${dns.getServers().join(", ")}`);
};

const connectDB = async (): Promise<mongoose.Connection> => {
  const uri = process.env.MONGO_URI;

  if (!uri) throw new Error("MONGO_URI is not defined in .env");

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