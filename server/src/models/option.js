import { DataTypes } from "sequelize";
import sequelize from "../db/connection.js";
import { MAX_TRACK_LABEL_LENGTH } from "../validation.js";

const Option = sequelize.define(
  "Option",
  {
    dilemmaId: { type: DataTypes.INTEGER, allowNull: false },
    // "Do nothing" or "Pull the lever". The same two answers for every dilemma.
    text: { type: DataTypes.STRING, allowNull: false },
    // 0 is the top (straight) track, where the trolley goes if nobody acts. 1 is the bottom track.
    position: { type: DataTypes.INTEGER, allowNull: false },
    // What the trolley hits on this option's track, for example "5 people".
    trackLabel: { type: DataTypes.STRING(MAX_TRACK_LABEL_LENGTH), allowNull: false },
    // How many people the game draws on this track.
    peopleOnTrack: { type: DataTypes.INTEGER, allowNull: false },
  },
  { timestamps: false },
);

export default Option;
