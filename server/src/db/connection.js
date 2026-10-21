import fs from "node:fs";
import path from "node:path";
import { Sequelize } from "sequelize";
import config from "../config.js";

const serverFolder = path.resolve(import.meta.dirname, "..", "..");

function getStoragePath() {
  if (config.databaseFile === ":memory:") {
    return ":memory:";
  }

  const storagePath = path.resolve(serverFolder, config.databaseFile);
  // SQLite creates the database file, but not the folder it goes in.
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  return storagePath;
}

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: getStoragePath(),
  logging: false,
});

export default sequelize;
