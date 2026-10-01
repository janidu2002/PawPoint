import { Router } from "express";

import { create, setStatus } from "../controllers/appointment.controller";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/**
 * Booking is open to any authenticated user - a pet owner books for their own
 * animal, never on someone else's behalf, so `userId` comes from the JWT.
 */
router.post("/", requireAuth, create);

/**
 * Status changes are admin-only: the clinic confirms and completes slots.
 *
 * `requireAdmin` depends on `requireAuth` having set `req.userId`, so it always
 * follows it rather than replacing it.
 */
router.patch("/:id/status", requireAuth, requireAdmin, setStatus);

export default router;
