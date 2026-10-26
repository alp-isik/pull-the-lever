import { rateLimit } from "express-rate-limit";
import { ONE_HOUR } from "../cookies.js";

const FIFTEEN_MINUTES = ONE_HOUR / 4;

// Limits count requests per IP address. Over the limit, the client gets status 429.

// Stop password guessing. Only failed logins count, so the real admin is not locked out.
export const adminLoginLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  skipSuccessfulRequests: true,
  message: { error: "Too many failed logins. Wait 15 minutes and try again." },
});

// Stop one person from filling the suggestion list with spam.
export const suggestionLimit = rateLimit({
  windowMs: ONE_HOUR,
  limit: 10,
  message: { error: "You sent a lot of ideas. Wait an hour and try again." },
});
