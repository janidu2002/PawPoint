import { Router } from "express";

import authRoutes from "./auth.routes";

/**
 * Aggregates every feature router. Mounted once at `/api` in server.ts, so a
 * new feature only has to be registered here.
 */
const router = Router();

router.use("/auth", authRoutes);

export default router;
