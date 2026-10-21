import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Vote = sequelize.define(
  "Vote",
  {
    playerId: { type: DataTypes.STRING(36), allowNull: false },
    dilemmaId: { type: DataTypes.INTEGER, allowNull: false },
    optionId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    updatedAt: false,
    // A player can vote only once on each dilemma.
    indexes: [{ unique: true, fields: ["playerId", "dilemmaId"] }],
  },
);

export default Vote;
