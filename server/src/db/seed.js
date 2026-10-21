// Fill an empty database with the starter dilemmas. Run: npm run seed
import { Dilemma, sequelize } from "../models/index.js";
import { createDilemma } from "../services/dilemmas.js";
// "with { type: 'json' }" tells Node to load the file as JSON data, not as code.
import starterDilemmas from "./dilemmas.json" with { type: "json" };

await sequelize.sync();

const existingCount = await Dilemma.count();
if (existingCount > 0) {
  console.log(`The database already has ${existingCount} dilemmas. Nothing was added.`);
} else {
  for (const dilemma of starterDilemmas) {
    await createDilemma(dilemma.text, dilemma.options, "approved");
  }
  console.log(`Added ${starterDilemmas.length} dilemmas.`);
}

await sequelize.close();
