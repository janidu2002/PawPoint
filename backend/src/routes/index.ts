import { Router } from "express";

import appointmentRoutes from "./appointment.routes";
import authRoutes from "./auth.routes";
import doctorRoutes from "./doctor.routes";

/**
 * Aggregates every feature router. Mounted once at `/api` in server.ts, so a
 * new feature only has to be registered here.
 */
const router = Router();

router.use("/appointments", appointmentRoutes);
router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);

export default router;
