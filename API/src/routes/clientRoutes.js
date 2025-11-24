import { Router } from "express";
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, requireRole("ADMIN"), listClients);
router.post("/", authRequired, requireRole("ADMIN"), createClient);
router.put("/:id", authRequired, requireRole("ADMIN"), updateClient);
router.delete("/:id", authRequired, requireRole("ADMIN"), deleteClient);

export default router;
