import sequelize from "../db/connection.js";
import Dilemma from "./dilemma.js";
import Option from "./option.js";
import Vote from "./vote.js";

// A dilemma has two options. Deleting a dilemma also deletes its options and votes.
Dilemma.hasMany(Option, { foreignKey: "dilemmaId", onDelete: "CASCADE" });
Option.belongsTo(Dilemma, { foreignKey: "dilemmaId" });

Dilemma.hasMany(Vote, { foreignKey: "dilemmaId", onDelete: "CASCADE" });
Vote.belongsTo(Dilemma, { foreignKey: "dilemmaId" });

Option.hasMany(Vote, { foreignKey: "optionId", onDelete: "CASCADE" });
Vote.belongsTo(Option, { foreignKey: "optionId" });

export { sequelize, Dilemma, Option, Vote };
