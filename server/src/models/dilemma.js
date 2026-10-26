import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { MAX_DILEMMA_LENGTH } from "../validation.js";

// Only the admin adds dilemmas, so every dilemma in the table is in the game.
const Dilemma = sequelize.define("Dilemma", {
  text: { type: DataTypes.STRING(MAX_DILEMMA_LENGTH), allowNull: false },
});

export default Dilemma;
