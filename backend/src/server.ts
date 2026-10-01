import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "http";

import connectDB from "./config/db";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "PawPoint API is running",
  });
});

const PORT = Number(process.env.PORT) || 5000;

connectDB()
  .then((): Server =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  )
  .catch((err: Error) => {
    console.error(err.message);
    process.exit(1);
  });