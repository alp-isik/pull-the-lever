import { Router } from "express";
import { getPlayerSummary } from "../services/results.js";

const router = Router();

// GET /api/players/me/summary
// How often this player agreed with everyone else.
router.get("/me/summary", async (req, res) => {
  const summary = await getPlayerSummary(req.playerId);
  res.json(summary);
});

export default router;
