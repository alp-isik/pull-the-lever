// Read every setting from the environment in one place.
const config = {
  port: Number(process.env.PORT) || 3000,
  databaseFile: process.env.DATABASE_FILE || "data/game.db",
  adminPassword: process.env.ADMIN_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  isProduction: process.env.NODE_ENV === "production",
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
