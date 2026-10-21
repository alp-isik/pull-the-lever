import { Router } from "express";
import { Dilemma, Option, Vote } from "../models/index.js";
import { httpError } from "../errors.js";
import { parseId } from "../validation.js";
import { findDilemmasByStatus, findPicksByPlayer, toDilemmaJson } from "../services/dilemmas.js";
import { getDilemmaResults } from "../services/results.js";

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

  const option = await Option.findOne({
    where: { id: optionId, dilemmaId },
    include: { model: Dilemma, where: { status: "approved" } },
  });
  if (!option) {
    throw httpError(404, "This option does not exist.");
  }

  // Keep the first vote. A player cannot change an answer.
  const [vote] = await Vote.findOrCreate({
    where: { playerId: req.playerId, dilemmaId },
    defaults: { optionId },
  });
  const results = await getDilemmaResults(dilemmaId);

  res.json({ pickedOptionId: vote.optionId, ...results });
});

export default router;
