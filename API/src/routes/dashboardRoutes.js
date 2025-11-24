import { Router } from "express";
import { dashboardStats } from "../controllers/dashboardController.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, dashboardStats);

export default router;
