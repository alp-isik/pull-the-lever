import config, { checkRequiredSettings } from "./config.js";
import { sequelize } from "./models/index.js";
import app from "./app.js";

checkRequiredSettings();

// Create the tables if they do not exist yet.
await sequelize.sync();

app.listen(config.port, () => {
  console.log(`Server runs on http://localhost:${config.port}`);
});
