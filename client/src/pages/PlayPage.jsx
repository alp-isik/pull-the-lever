import { useEffect, useState } from "react";
import { getDilemmas, sendVote } from "../api.js";
import Notice from "../components/Notice.jsx";
import OptionCard from "../components/OptionCard.jsx";
import SummaryScreen from "../components/SummaryScreen.jsx";
import TrackFork from "../components/TrackFork.jsx";
import { primaryButton } from "../components/styles.js";

// The first option takes the top branch, the second takes the bottom branch.
// The top branch goes straight on: it is where the trolley goes if nobody acts.
const SIDES = ["top", "bottom"];

// What stands on each track, in the shape TrackFork uses.
function getStakes(options) {
  return {
    top: { label: options[0].trackLabel, people: options[0].peopleOnTrack },
    bottom: { label: options[1].trackLabel, people: options[1].peopleOnTrack },
  };
}

// Find the first dilemma at or after startIndex that the player has not answered.
// Then a page reload does not restart the game, and the player never sees a dilemma twice.
// Return dilemmas.length when every dilemma from startIndex on is answered.
function findUnansweredIndex(dilemmas, startIndex) {
  for (let index = startIndex; index < dilemmas.length; index += 1) {
    if (dilemmas[index].pickedOptionId === null) {
      return index;
    }
  }
  return dilemmas.length;
}

// The track of an option: "top", "bottom", or null when no option is given.
function getSide(options, optionId) {
  const index = options.findIndex((option) => option.id === optionId);
  if (index === -1) {
    return null;
  }
  return SIDES[index];
}

// The server sorts the pick into a category, so this page and the end screen always agree.
function describeAgreement(category, agreePercent, totalVotes) {
  if (totalVotes <= 1) {
    return "You are the first to answer this one.";
  }
  if (category === "notEnoughData") {
    return `${agreePercent}% agree with you so far. Too few votes to call it yet.`;
  }
  if (category === "mainstream") {
    return `${agreePercent}% of people agree with you.`;
  }
  if (category === "hotTake") {
    return `Only ${agreePercent}% of people agree with you. Hot take.`;
  }
  return `${agreePercent}% agree with you. People are split on this one.`;
}

export default function PlayPage() {
  const [dilemmas, setDilemmas] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickedOptionId, setPickedOptionId] = useState(null);
  // The option under the mouse or the keyboard focus, before the vote.
  const [pointedOptionId, setPointedOptionId] = useState(null);
  const [results, setResults] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [voteError, setVoteError] = useState(null);

  useEffect(() => {
    getDilemmas()
      .then((list) => {
        setDilemmas(list);
        setCurrentIndex(findUnansweredIndex(list, 0));
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  if (loadError) {
    return <Notice tone="error">{loadError}</Notice>;
  }
  if (!dilemmas) {
    return <p className="text-muted">Loading the tracks…</p>;
  }
  if (dilemmas.length === 0) {
    return <Notice>There are no dilemmas yet. Come back soon.</Notice>;
  }
  if (currentIndex >= dilemmas.length) {
    return <SummaryScreen />;
  }

  const dilemma = dilemmas[currentIndex];
  const nextIndex = findUnansweredIndex(dilemmas, currentIndex + 1);
  const isLastDilemma = nextIndex === dilemmas.length;

  async function pickOption(optionId) {
    // Start the trolley at once. The results come in while it drives.
    setPickedOptionId(optionId);
    setVoteError(null);
    try {
      const voteResults = await sendVote(dilemma.id, optionId);
      setPickedOptionId(voteResults.pickedOptionId);
      setResults(voteResults);
    } catch (error) {
      setPickedOptionId(null);
      setVoteError(error.message);
    }
  }

  function goToNextDilemma() {
    setPickedOptionId(null);
    setPointedOptionId(null);
    setResults(null);
    setCurrentIndex(nextIndex);
  }

  function findOptionResult(optionId) {
    if (!results) {
      return null;
    }
    return results.options.find((option) => option.id === optionId);
  }

  const pickedResult = findOptionResult(pickedOptionId);
  // Before the vote, the people on the track of the pointed option grow a little.
  const atRiskSide = pickedOptionId === null ? getSide(dilemma.options, pointedOptionId) : null;

  return (
    // The track takes the height that is left over, so the whole game fits on one screen.
    <section className="flex flex-1 flex-col gap-3 sm:gap-4">
      <p className="text-center text-sm font-semibold text-muted">
        Dilemma {currentIndex + 1} of {dilemmas.length}
      </p>

      {/* "absolute" takes the drawing out of the layout. The box then gets its height from the
          free space only, and the drawing shrinks to fit inside it. */}
      <div className="relative min-h-28 flex-1">
        <div className="absolute inset-0">
          {/* key: a new dilemma gets a new track, so the trolley starts at the left again. */}
          <TrackFork
            key={dilemma.id}
            pickedSide={getSide(dilemma.options, pickedOptionId)}
            stakes={getStakes(dilemma.options)}
            atRiskSide={atRiskSide}
          />
        </div>
      </div>

      {/* The question sits right above the answers, so the player reads it next to the two options. */}
      <h1 className="min-h-[2lh] text-center text-xl leading-tight font-extrabold tracking-tight text-balance sm:text-3xl lg:text-4xl">
        {dilemma.text}
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {dilemma.options.map((option, index) => (
          <OptionCard
            key={option.id}
            label={index === 0 ? "Top" : "Bottom"}
            option={option}
            isPicked={option.id === pickedOptionId}
            isLocked={pickedOptionId !== null}
            result={findOptionResult(option.id)}
            onPick={pickOption}
            onPointAt={setPointedOptionId}
          />
        ))}
      </div>

      {/* This space is kept free before the vote, so the page does not jump when the result appears. */}
      <div className="flex min-h-32 flex-col items-center justify-start gap-2 text-center">
        {voteError && <Notice tone="error">{voteError}</Notice>}

        {!results && !voteError && <p className="text-muted">Pick a track.</p>}

        {results && (
          <div className="fade-up flex flex-col items-center gap-2">
            <p className="text-lg font-bold text-balance sm:text-2xl">
              {describeAgreement(results.category, pickedResult.percent, results.totalVotes)}
            </p>
            <p className="text-sm text-muted">
              {results.totalVotes} {results.totalVotes === 1 ? "vote" : "votes"} so far
            </p>
            <button type="button" className={primaryButton} onClick={goToNextDilemma} autoFocus>
              {isLastDilemma ? "See your results" : "Next dilemma"} →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
