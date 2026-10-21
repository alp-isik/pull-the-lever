import crypto from "node:crypto";
import { cookieOptions, ONE_YEAR } from "../cookies.js";

const PLAYER_COOKIE = "playerId";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function isValidPlayerId(value) {
  if (typeof value !== "string") {
    return false;
  }
  if (!UUID_PATTERN.test(value)) {
    return false;
  }
  return true;
}

// Players do not log in. Each browser gets a random ID in a cookie, and votes are saved under it.
export function identifyPlayer(req, res, next) {
  let playerId = req.cookies[PLAYER_COOKIE];

  if (!isValidPlayerId(playerId)) {
    playerId = crypto.randomUUID();
    res.cookie(PLAYER_COOKIE, playerId, cookieOptions(ONE_YEAR));
  }

  req.playerId = playerId;
  next();
}
