import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { MAX_DILEMMA_LENGTH } from "../validation.js";

// "pending": a player submitted it. "approved": it is in the game. "rejected": an admin said no.
const DILEMMA_STATUSES = ["pending", "approved", "rejected"];

const Dilemma = sequelize.define("Dilemma", {
  text: { type: DataTypes.STRING(MAX_DILEMMA_LENGTH), allowNull: false },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending",
    validate: { isIn: [DILEMMA_STATUSES] },
  },
});

export default Dilemma;
