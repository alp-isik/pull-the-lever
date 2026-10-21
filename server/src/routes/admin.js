import { Router } from "express";
import { httpError } from "../errors.js";
import { parseId } from "../validation.js";
import { findDilemmasByStatus, reviewDilemma, toDilemmaJson } from "../services/dilemmas.js";
import {
  endAdminSession,
  isAdminRequest,
  isCorrectAdminPassword,
  requireAdmin,
  startAdminSession,
} from "../middleware/admin.js";
import { adminLoginLimit } from "../middleware/rateLimits.js";

const router = Router();

// The admin can only approve or reject. "pending" is the start state.
const REVIEW_STATUSES = ["approved", "rejected"];

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

// GET /api/admin/submissions
// Dilemmas that players submitted and that wait for review.
router.get("/submissions", requireAdmin, async (req, res) => {
  const dilemmas = await findDilemmasByStatus("pending");
  res.json(dilemmas.map(toDilemmaJson));
});

// PATCH /api/admin/submissions/:id  { status: "approved" | "rejected" }
router.patch("/submissions/:id", requireAdmin, async (req, res) => {
  const dilemmaId = parseId(req.params.id);
  const status = req.body?.status;
  if (!dilemmaId || !REVIEW_STATUSES.includes(status)) {
    throw httpError(400, 'Send a valid ID and a status of "approved" or "rejected".');
  }

  const dilemma = await reviewDilemma(dilemmaId, status);
  if (!dilemma) {
    throw httpError(404, "This dilemma does not exist.");
  }

  res.json({ id: dilemma.id, status: dilemma.status });
});

export default router;
