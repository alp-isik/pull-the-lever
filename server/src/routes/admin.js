import { Router } from "express";
import { httpError } from "../errors.js";
import {
  isValidDilemma,
  MAX_DILEMMA_LENGTH,
  MAX_PEOPLE_ON_TRACK,
  MAX_TRACK_LABEL_LENGTH,
  MIN_PEOPLE_ON_TRACK,
  parseId,
} from "../validation.js";
import { createDilemma, deleteDilemma, toDilemmaJson } from "../services/dilemmas.js";
import { deleteSuggestion, findAllSuggestions, toSuggestionJson } from "../services/suggestions.js";
import {
  endAdminSession,
  isAdminRequest,
  isCorrectAdminPassword,
  requireAdmin,
  startAdminSession,
} from "../middleware/admin.js";
import { adminLoginLimit } from "../middleware/rateLimits.js";

const router = Router();

// GET /api/admin/session
router.get("/session", (req, res) => {
  res.json({ isAdmin: isAdminRequest(req) });
});

// POST /api/admin/login  { password }
router.post("/login", adminLoginLimit, (req, res) => {
  if (!isCorrectAdminPassword(req.body?.password)) {
    throw httpError(401, "Wrong password.");
  }

  startAdminSession(res);
  res.json({ isAdmin: true });
});

// POST /api/admin/logout
router.post("/logout", (req, res) => {
  endAdminSession(res);
  res.json({ isAdmin: false });
});

// POST /api/admin/dilemmas
// { text, doNothing: { trackLabel, peopleOnTrack }, pullTheLever: { trackLabel, peopleOnTrack } }
// Add a dilemma to the game.
router.post("/dilemmas", requireAdmin, async (req, res) => {
  const text = req.body?.text;
  const doNothing = req.body?.doNothing;
  const pullTheLever = req.body?.pullTheLever;
  if (!isValidDilemma(text, doNothing, pullTheLever)) {
    throw httpError(
      400,
      `Write a dilemma (up to ${MAX_DILEMMA_LENGTH} characters). Each track needs a label ` +
        `(up to ${MAX_TRACK_LABEL_LENGTH} characters) and ${MIN_PEOPLE_ON_TRACK} to ${MAX_PEOPLE_ON_TRACK} people.`,
    );
  }

  const dilemma = await createDilemma(text, doNothing, pullTheLever);
  res.status(201).json(toDilemmaJson(dilemma));
});

// DELETE /api/admin/dilemmas/:id
// Remove a dilemma from the game. Its votes go too.
router.delete("/dilemmas/:id", requireAdmin, async (req, res) => {
  const dilemmaId = parseId(req.params.id);
  if (!dilemmaId) {
    throw httpError(400, "Send a valid dilemma ID.");
  }
  if (!(await deleteDilemma(dilemmaId))) {
    throw httpError(404, "This dilemma does not exist.");
  }

  res.status(204).end();
});

// GET /api/admin/suggestions
router.get("/suggestions", requireAdmin, async (req, res) => {
  const suggestions = await findAllSuggestions();
  res.json(suggestions.map(toSuggestionJson));
});

// DELETE /api/admin/suggestions/:id
// The admin read the suggestion and is done with it.
router.delete("/suggestions/:id", requireAdmin, async (req, res) => {
  const suggestionId = parseId(req.params.id);
  if (!suggestionId) {
    throw httpError(400, "Send a valid suggestion ID.");
  }
  if (!(await deleteSuggestion(suggestionId))) {
    throw httpError(404, "This suggestion does not exist.");
  }

  res.status(204).end();
});

export default router;
