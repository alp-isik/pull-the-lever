import { Dilemma, Option, Vote } from "../models/index.js";

export async function createDilemma(text, optionTexts, status) {
  return Dilemma.create(
    {
      text: text.trim(),
      status,
      Options: optionTexts.map((optionText, position) => ({
        text: optionText.trim(),
        position,
      })),
    },
    { include: Option },
  );
}

// Put a dilemma from the database into the shape the client uses.
export function toDilemmaJson(dilemma) {
  return {
    id: dilemma.id,
    text: dilemma.text,
    options: dilemma.Options.map((option) => ({ id: option.id, text: option.text })),
  };
}

export async function findDilemmasByStatus(status) {
  return Dilemma.findAll({
    where: { status },
    include: Option,
    order: [
      ["id", "ASC"],
      [Option, "position", "ASC"],
    ],
  });
}

// Set the review status of a dilemma. Return null if the dilemma does not exist.
export async function reviewDilemma(dilemmaId, status) {
  const dilemma = await Dilemma.findByPk(dilemmaId);
  if (!dilemma) {
    return null;
  }

  dilemma.status = status;
  await dilemma.save();
  return dilemma;
}

// Return a Map of dilemma ID -> the option ID this player picked.
export async function findPicksByPlayer(playerId) {
  const votes = await Vote.findAll({ where: { playerId }, raw: true });
  return new Map(votes.map((vote) => [vote.dilemmaId, vote.optionId]));
}
