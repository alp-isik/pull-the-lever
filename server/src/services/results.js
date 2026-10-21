import { Dilemma, Option, Vote, sequelize } from "../models/index.js";

// Below this many votes, the percentages say too little about other players.
export const MIN_VOTES_FOR_RESULT = 5;

export function toPercent(part, total) {
  if (total === 0) {
    return 0;
  }
  return Math.round((part / total) * 100);
}

// Sort a pick by how many players agreed with it.
export function classifyPick(agreePercent, totalVotes) {
  if (totalVotes < MIN_VOTES_FOR_RESULT) {
    return "notEnoughData";
  }
  if (agreePercent >= 60) {
    return "mainstream";
  }
  if (agreePercent <= 40) {
    return "hotTake";
  }
  return "closeCall";
}

// Return a Map of option ID -> number of votes, for every option of these dilemmas.
async function countVotesByOption(dilemmaIds) {
  const rows = await Vote.findAll({
    attributes: ["optionId", [sequelize.fn("COUNT", sequelize.col("id")), "votes"]],
    where: { dilemmaId: dilemmaIds },
    group: ["optionId"],
    raw: true,
  });
  return new Map(rows.map((row) => [row.optionId, Number(row.votes)]));
}

export async function getDilemmaResults(dilemmaId) {
  const options = await Option.findAll({
    where: { dilemmaId },
    order: [["position", "ASC"]],
  });
  const votesByOption = await countVotesByOption([dilemmaId]);

  let totalVotes = 0;
  for (const option of options) {
    totalVotes += votesByOption.get(option.id) || 0;
  }

  return {
    totalVotes,
    options: options.map((option) => {
      const votes = votesByOption.get(option.id) || 0;
      return { id: option.id, votes, percent: toPercent(votes, totalVotes) };
    }),
  };
}

export async function getPlayerSummary(playerId) {
  const totalDilemmas = await Dilemma.count({ where: { status: "approved" } });
  const playerVotes = await Vote.findAll({
    where: { playerId },
    include: [
      { model: Dilemma, where: { status: "approved" }, include: Option },
      { model: Option },
    ],
    order: [["dilemmaId", "ASC"]],
  });

  const dilemmaIds = playerVotes.map((vote) => vote.dilemmaId);
  const votesByOption = await countVotesByOption(dilemmaIds);

  const summary = {
    answered: playerVotes.length,
    totalDilemmas,
    minVotesForResult: MIN_VOTES_FOR_RESULT,
    counts: { mainstream: 0, closeCall: 0, hotTake: 0, notEnoughData: 0 },
    picks: [],
  };

  for (const vote of playerVotes) {
    let totalVotes = 0;
    for (const option of vote.Dilemma.Options) {
      totalVotes += votesByOption.get(option.id) || 0;
    }
    const agreePercent = toPercent(votesByOption.get(vote.optionId) || 0, totalVotes);
    const category = classifyPick(agreePercent, totalVotes);

    summary.counts[category] += 1;
    summary.picks.push({
      dilemmaText: vote.Dilemma.text,
      pickedText: vote.Option.text,
      agreePercent,
      totalVotes,
      category,
    });
  }

  return summary;
}
