import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

// "pending": a player submitted it. "approved": it is in the game. "rejected": an admin said no.
export const DILEMMA_STATUSES = ["pending", "approved", "rejected"];

const Dilemma = sequelize.define("Dilemma", {
  text: { type: DataTypes.STRING(200), allowNull: false },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending",
    validate: { isIn: [DILEMMA_STATUSES] },
  },
});

export default Dilemma;
