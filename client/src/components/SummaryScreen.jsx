import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getPlayerSummary } from "../api.js";
import Notice from "./Notice.jsx";
import { card, primaryButton, secondaryButton } from "./styles.js";

const HOT_TAKES_TO_SHOW = 3;

const categoryLabels = {
  mainstream: "Mainstream",
  closeCall: "Close call",
  hotTake: "Hot take",
  notEnoughData: "Too few votes",
};

function findHottestTakes(picks) {
  return picks
    .filter((pick) => pick.category === "hotTake")
    .sort((first, second) => first.agreePercent - second.agreePercent)
    .slice(0, HOT_TAKES_TO_SHOW);
}

function StatTile({ value, label, hint }) {
  return (
    <div className={card}>
      <p className="text-5xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-2 font-semibold">{label}</p>
      <p className="text-sm text-muted">{hint}</p>
    </div>
  );
}

// The end screen: how often the player agreed with everyone else.
export default function SummaryScreen() {
  const [summary, setSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    getPlayerSummary()
      .then(setSummary)
      .catch((error) => setErrorMessage(error.message));
  }, []);

  if (errorMessage) {
    return <Notice tone="error">{errorMessage}</Notice>;
  }
  if (!summary) {
    return <p className="text-muted">Counting your votes…</p>;
  }

  const hottestTakes = findHottestTakes(summary.picks);

  return (
    <section className="flex flex-col gap-10 pt-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-bold tracking-widest text-accent uppercase">End of the line</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          You made {summary.answered} decisions.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Here is how your picks compare with everyone else's.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          value={summary.counts.mainstream}
          label="Mainstream"
          hint="60% or more agreed with you"
        />
        <StatTile value={summary.counts.closeCall} label="Close calls" hint="Players were split" />
        <StatTile
          value={summary.counts.hotTake}
          label="Hot takes"
          hint="40% or fewer agreed with you"
        />
      </div>

      {summary.counts.notEnoughData > 0 && (
        <Notice>
          {summary.counts.notEnoughData} of your picks have fewer than {summary.minVotesForResult}{" "}
          votes, so they are not sorted yet. Come back later to see where they land.
        </Notice>
      )}

      {hottestTakes.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Your hottest takes</h2>
          {hottestTakes.map((pick) => (
            <div key={pick.dilemmaText} className={card}>
              <p className="text-muted">{pick.dilemmaText}</p>
              <p className="mt-2 font-semibold">
                You picked "{pick.pickedText}". Only {pick.agreePercent}% agreed.
              </p>
            </div>
          ))}
        </div>
      )}

      <details className={card}>
        <summary className="cursor-pointer font-semibold">All your answers</summary>
        <ul className="mt-4 divide-y-2 divide-line">
          {summary.picks.map((pick) => (
            <li
              key={pick.dilemmaText}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6"
            >
              <span className="text-muted">{pick.dilemmaText}</span>
              <span className="shrink-0 font-semibold">
                {pick.pickedText} · {pick.agreePercent}% · {categoryLabels[pick.category]}
              </span>
            </li>
          ))}
        </ul>
      </details>

      <div className="flex flex-wrap gap-3">
        <Link to="/submit" className={primaryButton}>
          Submit your own dilemma
        </Link>
        <Link to="/" className={secondaryButton}>
          Back to the start
        </Link>
      </div>
    </section>
  );
}
