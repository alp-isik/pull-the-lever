import { Router } from "express";
import { httpError } from "../errors.js";
import { isValidDilemma, MAX_DILEMMA_LENGTH, MAX_OPTION_LENGTH } from "../validation.js";
import { createDilemma } from "../services/dilemmas.js";
import { submissionLimit } from "../middleware/rateLimits.js";

const router = Router();

// POST /api/submissions  { text, options: [left, right] }
// A player suggests a dilemma. It stays hidden until an admin approves it.
router.post("/", submissionLimit, async (req, res) => {
  const text = req.body?.text;
  const options = req.body?.options;
  if (!isValidDilemma(text, options)) {
    throw httpError(
      400,
      `Write a dilemma (up to ${MAX_DILEMMA_LENGTH} characters) and two options (up to ${MAX_OPTION_LENGTH} characters each).`,
    );
  }

  const dilemma = await createDilemma(text, options, "pending");
  res.status(201).json({ id: dilemma.id });
});

export default router;
