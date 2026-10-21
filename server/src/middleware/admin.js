import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../config.js";
import { cookieOptions, ONE_HOUR } from "../cookies.js";
import { httpError } from "../errors.js";

const ADMIN_COOKIE = "adminToken";
const SESSION_HOURS = 8;

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest();
}

export function isCorrectAdminPassword(password) {
  if (typeof password !== "string") {
    return false;
  }

  // Compare hashes, so both values have the same length. timingSafeEqual needs that.
  // timingSafeEqual takes the same time for every input, so an attacker cannot guess the password from response times.
  const givenHash = hashText(password);
  const expectedHash = hashText(config.adminPassword);
  if (crypto.timingSafeEqual(givenHash, expectedHash)) {
    return true;
  }
  return false;
}

export function startAdminSession(res) {
  const token = jwt.sign({ role: "admin" }, config.jwtSecret, {
    expiresIn: `${SESSION_HOURS}h`,
  });
  res.cookie(ADMIN_COOKIE, token, cookieOptions(SESSION_HOURS * ONE_HOUR));
}

export function endAdminSession(res) {
  res.clearCookie(ADMIN_COOKIE, cookieOptions());
}

export function isAdminRequest(req) {
  const token = req.cookies[ADMIN_COOKIE];
  if (!token) {
    return false;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.role === "admin") {
      return true;
    }
    return false;
  } catch {
    // The token is expired or was changed.
    return false;
  }
}

export function requireAdmin(req, res, next) {
  if (!isAdminRequest(req)) {
    throw httpError(401, "Log in as admin first.");
  }
  next();
}
