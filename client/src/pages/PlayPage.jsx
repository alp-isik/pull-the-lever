import { useEffect, useState } from "react";
import { getDilemmas, sendVote } from "../api.js";
import Notice from "../components/Notice.jsx";
import OptionCard from "../components/OptionCard.jsx";
import SummaryScreen from "../components/SummaryScreen.jsx";
import TrackFork from "../components/TrackFork.jsx";
import { primaryButton } from "../components/styles.js";

// The first option takes the top branch, the second takes the bottom branch.
const SIDES = ["top", "bottom"];

// Start at the first dilemma the player has not answered, so a page reload does not restart the game.
function findFirstUnansweredIndex(dilemmas) {
  const index = dilemmas.findIndex((dilemma) => dilemma.pickedOptionId === null);
  if (index === -1) {
    return dilemmas.length;
  }
  return index;
}

function getPickedSide(options, pickedOptionId) {
  const index = options.findIndex((option) => option.id === pickedOptionId);
  if (index === -1) {
    return null;
  }
  return SIDES[index];
}

function describeAgreement(agreePercent, totalVotes) {
  if (totalVotes <= 1) {
    return "You are the first to answer this one.";
  }
  if (agreePercent >= 60) {
    return `${agreePercent}% of people agree with you.`;
  }
  if (agreePercent <= 40) {
    return `Only ${agreePercent}% of people agree with you. Hot take.`;
  }
  return `${agreePercent}% agree with you. People are split on this one.`;
}

export default function PlayPage() {
  const [dilemmas, setDilemmas] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickedOptionId, setPickedOptionId] = useState(null);
  const [results, setResults] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [voteError, setVoteError] = useState(null);

  useEffect(() => {
    getDilemmas()
      .then((list) => {
        setDilemmas(list);
        setCurrentIndex(findFirstUnansweredIndex(list));
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
    return (
      <Notice>
        There are no dilemmas yet. Run <code>npm run seed</code> to add the starter set.
      </Notice>
    );
  }
  if (currentIndex >= dilemmas.length) {
    return <SummaryScreen />;
  }

  const dilemma = dilemmas[currentIndex];
  const isLastDilemma = currentIndex === dilemmas.length - 1;

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
    setResults(null);
    setCurrentIndex(currentIndex + 1);
  }

  function findOptionResult(optionId) {
    if (!results) {
      return null;
    }
    return results.options.find((option) => option.id === optionId);
  }

  const pickedResult = findOptionResult(pickedOptionId);

  return (
    // The track takes the height that is left over, so the whole game fits on one screen.
    <section className="flex flex-1 flex-col gap-3 sm:gap-4">
      <p className="text-center text-sm font-semibold text-muted">
        Dilemma {currentIndex + 1} of {dilemmas.length}
      </p>

      <h1 className="min-h-[2lh] text-center text-xl leading-tight font-extrabold tracking-tight text-balance sm:text-3xl lg:text-4xl">
        {dilemma.text}
      </h1>

      {/* "absolute" takes the drawing out of the layout. The box then gets its height from the
          free space only, and the drawing shrinks to fit inside it. */}
      <div className="relative min-h-28 flex-1">
        <div className="absolute inset-0">
          {/* key: a new dilemma gets a new track, so the trolley starts at the left again. */}
          <TrackFork key={dilemma.id} pickedSide={getPickedSide(dilemma.options, pickedOptionId)} />
        </div>
      </div>

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
              {describeAgreement(pickedResult.percent, results.totalVotes)}
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
