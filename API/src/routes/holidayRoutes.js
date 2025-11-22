import { Router } from "express";
import {
  listHolidays,
  createHoliday,
} from "../controllers/holidayController.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, listHolidays);
router.post("/", authRequired, requireRole("ADMIN", "HR"), createHoliday);

export default router;
