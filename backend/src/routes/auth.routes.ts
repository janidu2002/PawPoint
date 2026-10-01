import { Router } from "express";

import { deleteProfile, login, me, register, updatePassword, updateProfile } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.delete("/profile", requireAuth, deleteProfile);
router.put("/password", requireAuth, updatePassword);

export default router;
