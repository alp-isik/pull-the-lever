import { Router } from "express";
import { httpError } from "../errors.js";
import { isValidText, MAX_SUGGESTION_LENGTH } from "../validation.js";
import { createSuggestion } from "../services/suggestions.js";
import { suggestionLimit } from "../middleware/rateLimits.js";

const router = Router();

// POST /api/suggestions  { text }
// A player sends an idea for a dilemma. Only the admin sees it.
router.post("/", suggestionLimit, async (req, res) => {
  const text = req.body?.text;
  if (!isValidText(text, MAX_SUGGESTION_LENGTH)) {
    throw httpError(400, `Write your idea in up to ${MAX_SUGGESTION_LENGTH} characters.`);
  }

  const suggestion = await createSuggestion(text);
  res.status(201).json({ id: suggestion.id });
});

export default router;
