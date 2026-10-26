import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { MAX_SUGGESTION_LENGTH } from "../validation.js";

// An idea for a dilemma that a player sent. The admin reads it and may write a dilemma from it.
const Suggestion = sequelize.define(
  "Suggestion",
  {
    text: { type: DataTypes.STRING(MAX_SUGGESTION_LENGTH), allowNull: false },
  },
  { updatedAt: false },
);

export default Suggestion;
