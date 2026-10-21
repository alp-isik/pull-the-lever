import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";

const Option = sequelize.define(
  "Option",
  {
    dilemmaId: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.STRING(60), allowNull: false },
    // 0 is the left option, 1 is the right option.
    position: { type: DataTypes.INTEGER, allowNull: false },
  },
  { timestamps: false },
);

export default Option;
