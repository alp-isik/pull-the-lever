import { Router } from "express";
import { httpError } from "../errors.js";
import { parseId } from "../validation.js";
import { findDilemmasByStatus, findPicksByPlayer, toDilemmaJson } from "../services/dilemmas.js";
import { castVote } from "../services/results.js";

const router = Router();

// GET /api/dilemmas
// Every approved dilemma in play order, with the option this player picked (or null).
router.get("/", async (req, res) => {
  const dilemmas = await findDilemmasByStatus("approved");
  const picksByDilemma = await findPicksByPlayer(req.playerId);

  res.json(
    dilemmas.map((dilemma) => ({
      ...toDilemmaJson(dilemma),
      pickedOptionId: picksByDilemma.get(dilemma.id) ?? null,
    })),
  );
});

// POST /api/dilemmas/:id/votes  { optionId }
// Save the player's vote and return how everyone voted.
router.post("/:id/votes", async (req, res) => {
  const dilemmaId = parseId(req.params.id);
  const optionId = parseId(req.body?.optionId);
  if (!dilemmaId || !optionId) {
    throw httpError(400, "Send a valid dilemma ID and option ID.");
  }

  const results = await castVote(req.playerId, dilemmaId, optionId);
  if (!results) {
    throw httpError(404, "This option does not exist.");
  }

  res.json(results);
});

export default router;
