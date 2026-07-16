import { getDashboardStatsService } from "../services/dashboardService.js";

export async function dashboardStats(req, res) {
  try {
    const stats = await getDashboardStatsService(req.user);
    return res.json(stats);
  } catch (err) {
    console.error("DASHBOARD STATS ERROR:", err);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
}
