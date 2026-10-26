import { Dilemma, Option, Vote, sequelize } from "../models/index.js";

// Below this many votes, the percentages say too little about other players.
export const MIN_VOTES_FOR_RESULT = 5;
// At or above this share of agreement, a pick is mainstream.
const MAINSTREAM_PERCENT = 60;
// At or below this share of agreement, a pick is a hot take.
const HOT_TAKE_PERCENT = 40;

function toPercent(part, total) {
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
  if (agreePercent >= MAINSTREAM_PERCENT) {
    return "mainstream";
  }
  if (agreePercent <= HOT_TAKE_PERCENT) {
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

async function getDilemmaResults(dilemmaId) {
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

// Save the player's vote and return how everyone voted on this dilemma.
// Return null if the option does not belong to this dilemma.
export async function castVote(playerId, dilemmaId, optionId) {
  const option = await Option.findOne({ where: { id: optionId, dilemmaId } });
  if (!option) {
    return null;
  }

  // Keep the first vote. A player cannot change an answer.
  const [vote] = await Vote.findOrCreate({
    where: { playerId, dilemmaId },
    defaults: { optionId },
  });
  const results = await getDilemmaResults(dilemmaId);
  const pickedResult = results.options.find((result) => result.id === vote.optionId);

  return {
    pickedOptionId: vote.optionId,
    category: classifyPick(pickedResult.percent, results.totalVotes),
    ...results,
  };
}

export async function getPlayerSummary(playerId) {
  const totalDilemmas = await Dilemma.count();
  const playerVotes = await Vote.findAll({
    where: { playerId },
    include: [{ model: Dilemma, include: Option }, { model: Option }],
    order: [["dilemmaId", "ASC"]],
  });

  const dilemmaIds = playerVotes.map((vote) => vote.dilemmaId);
  const votesByOption = await countVotesByOption(dilemmaIds);

  const summary = {
    answered: playerVotes.length,
    totalDilemmas,
    minVotesForResult: MIN_VOTES_FOR_RESULT,
    mainstreamPercent: MAINSTREAM_PERCENT,
    hotTakePercent: HOT_TAKE_PERCENT,
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
      dilemmaId: vote.dilemmaId,
      dilemmaText: vote.Dilemma.text,
      pickedText: vote.Option.text,
      agreePercent,
      totalVotes,
      category,
    });
  }

  return summary;
}
