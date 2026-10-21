// How many proxies sit in front of the server. 0 means none.
// Stop at start-up on a value such as "true", so a typo does not turn the setting off without a warning.
function readTrustProxyHops() {
  const value = process.env.TRUST_PROXY;
  if (value === undefined || value === "") {
    return 0;
  }

  const hops = Number(value);
  if (!Number.isInteger(hops) || hops < 0) {
    throw new Error(`TRUST_PROXY must be a whole number, for example 0 or 1. It is "${value}".`);
  }
  return hops;
}

// Read every setting from the environment in one place.
const config = {
  port: Number(process.env.PORT) || 3000,
  databaseFile: process.env.DATABASE_FILE || "data/game.db",
  adminPassword: process.env.ADMIN_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  isProduction: process.env.NODE_ENV === "production",
  trustProxyHops: readTrustProxyHops(),
};

const requiredSettings = ["ADMIN_PASSWORD", "JWT_SECRET"];

// Stop the server at start-up if a required setting is missing.
export function checkRequiredSettings() {
  const missingSettings = requiredSettings.filter((name) => !process.env[name]);
  if (missingSettings.length > 0) {
    throw new Error(
      `Missing settings: ${missingSettings.join(", ")}. Copy .env.example to .env and fill them in.`,
    );
  }
}

export default config;
