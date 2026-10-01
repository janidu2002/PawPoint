import { Router } from "express";

import {
  adminList,
  cancel,
  create,
  getById,
  list,
  remove,
  setStatus,
  update,
} from "../controllers/appointment.controller";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/**
 * Booking is open to any authenticated user - a pet owner books for their own
 * animal, never on someone else's behalf, so `userId` comes from the JWT.
 */
/**
 * The caller's own bookings, and the route they cancel through. Both scoped to
 * the JWT user, so neither needs an admin check.
 */
router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
router.post("/:id/cancel", requireAuth, cancel);

/** The clinic-wide queue must be declared before the parameterised `/:id` route. */
router.get("/admin", requireAuth, requireAdmin, adminList);
router.patch("/:id/status", requireAuth, requireAdmin, setStatus);

router.get("/:id", requireAuth, getById);
router.put("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

export default router;
