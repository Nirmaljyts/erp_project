import { getDashboardStatsService } from "../services/dashboardService.js";

export async function dashboardStats(req, res) {
  try {
    const stats = await getDashboardStatsService(req.user);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
}
