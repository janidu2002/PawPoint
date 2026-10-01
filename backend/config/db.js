const mongoose = require("mongoose");
const dns = require("dns");

const applyDnsServers = () => {
  const servers = process.env.DNS_SERVERS;
  if (!servers) return;

  dns.setServers(servers.split(",").map((s) => s.trim()).filter(Boolean));
  console.log(`Using DNS servers: ${dns.getServers().join(", ")}`);
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  applyDnsServers();

  const { connection } = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });

  connection.on("error", (err) => console.error(`MongoDB error: ${err.message}`));
  connection.on("disconnected", () => console.warn("MongoDB disconnected"));

  console.log(`MongoDB connected: ${connection.host}/${connection.name}`);
  return connection;
};

module.exports = connectDB;