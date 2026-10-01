import { Router } from "express";

import {
  create,
  getAvailability,
  getById,
  list,
  remove,
  update,
} from "../controllers/doctor.controller";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/**
 * Browsing is open to any authenticated user - a clinic roster is not private
 * data, and users need it to choose a doctor.
 */
router.get("/", requireAuth, list);
router.get("/:id", requireAuth, getById);
/** Nested under the doctor because availability derives from that doctor's
 *  schedule. Matches on segment count, so it cannot shadow `/:id`. */
router.get("/:id/availability", requireAuth, getAvailability);

/**
 * Writes require admin. Enforced here rather than by hiding the UI, so the
 * server is the authority regardless of what the client sends.
 *
 * `requireAdmin` depends on `requireAuth` having set `req.userId`, so it always
 * follows it rather than replacing it.
 */
router.post("/", requireAuth, requireAdmin, create);
router.put("/:id", requireAuth, requireAdmin, update);
router.delete("/:id", requireAuth, requireAdmin, remove);

export default router;
