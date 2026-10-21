import config from "./config.js";

export const ONE_HOUR = 60 * 60 * 1000;
export const ONE_YEAR = 365 * 24 * ONE_HOUR;

// httpOnly: page scripts cannot read the cookie.
// sameSite "lax": other sites cannot send it with their form posts.
export function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    maxAge,
  };
}
