import { Dilemma, Option, Vote } from "../models/index.js";

// Every dilemma has the same two answers. The first takes the top (straight) track.
const ANSWERS = ["Do nothing", "Pull the lever"];

// doNothing and pullTheLever: what stands on each track, as { trackLabel, peopleOnTrack }.
export async function createDilemma(text, doNothing, pullTheLever) {
  const tracks = [doNothing, pullTheLever];
  return Dilemma.create(
    {
      text: text.trim(),
      Options: tracks.map((track, position) => ({
        text: ANSWERS[position],
        trackLabel: track.trackLabel.trim(),
        peopleOnTrack: track.peopleOnTrack,
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
    options: dilemma.Options.map((option) => ({
      id: option.id,
      text: option.text,
      trackLabel: option.trackLabel,
      peopleOnTrack: option.peopleOnTrack,
    })),
  };
}

// Every dilemma in play order, with the top track's option first.
export async function findAllDilemmas() {
  return Dilemma.findAll({
    include: Option,
    order: [
      ["id", "ASC"],
      [Option, "position", "ASC"],
    ],
  });
}

// Delete a dilemma with its options and votes. Return false if the dilemma does not exist.
export async function deleteDilemma(dilemmaId) {
  const dilemma = await Dilemma.findByPk(dilemmaId);
  if (!dilemma) {
    return false;
  }

  await dilemma.destroy();
  return true;
}

// Return a Map of dilemma ID -> the option ID this player picked.
export async function findPicksByPlayer(playerId) {
  const votes = await Vote.findAll({ where: { playerId }, raw: true });
  return new Map(votes.map((vote) => [vote.dilemmaId, vote.optionId]));
}
