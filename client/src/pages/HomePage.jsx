import { Link } from "react-router";
import TrackFork from "../components/TrackFork.jsx";
import { largePrimaryButton, largeSecondaryButton } from "../components/styles.js";

const steps = [
  { title: "Pick a track", text: "Every dilemma has two options. No right answers." },
  { title: "See the split", text: "Find out how many people chose the same as you." },
  {
    title: "Get your verdict",
    text: "At the end, see if you are mainstream or full of hot takes.",
  },
];

export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col items-center gap-6 pt-4 text-center sm:pt-8">
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm font-bold tracking-widest text-accent uppercase">
          A game of small and silly dilemmas
        </p>
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
          Would you pull the lever?
        </h1>
      </div>

      {/* Same as on the Play page: the track takes the height that is left over. */}
      <div className="relative min-h-24 w-full flex-1">
        <div className="absolute inset-0">
          <TrackFork />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/play" className={largePrimaryButton}>
          Play
        </Link>
        <Link to="/submit" className={largeSecondaryButton}>
          Submit a dilemma
        </Link>
      </div>

      <ol className="grid w-full gap-4 pt-6 text-left sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-ink font-bold">
              {index + 1}
            </span>
            <span>
              <span className="block font-semibold">{step.title}</span>
              <span className="text-sm text-muted">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
