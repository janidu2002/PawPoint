import express from "express";
import cors from "cors";
import { Server } from "http";

import connectDB from "./config/db";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error";
import apiRouter from "./routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "PawPoint API is running",
  });
});

// All feature routes live under /api. New features register in routes/index.ts.
app.use("/api", apiRouter);

// Registered last: these only run for errors that reached the end of the stack.
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.port;

connectDB()
  .then((): Server =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  )
  .catch((err: Error) => {
    console.error(err.message);
    process.exit(1);
  });