// One of the two answers. Before the vote it is a button.
// After the vote it shows the share of players who picked it.

function getCardClass(isPicked, isLocked) {
  const baseClass =
    "group relative flex min-h-28 w-full flex-col justify-between gap-2 overflow-hidden rounded-2xl border-2 p-4 text-left sm:min-h-32 sm:gap-3 sm:p-5 transition";
  if (isPicked) {
    return `${baseClass} border-ink bg-card shadow-[4px_4px_0_var(--color-ink)]`;
  }
  if (isLocked) {
    return `${baseClass} border-line bg-card/60 text-muted`;
  }
  return `${baseClass} cursor-pointer border-ink bg-card hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`;
}

export default function OptionCard({ label, option, isPicked, isLocked, result, onPick }) {
  return (
    <button
      type="button"
      className={getCardClass(isPicked, isLocked)}
      disabled={isLocked}
      onClick={() => onPick(option.id)}
    >
      <span className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold tracking-widest text-muted uppercase">
        {label}
        {isPicked && (
          <span className="rounded-full bg-accent px-2 py-0.5 whitespace-nowrap text-on-accent">
            Your pick
          </span>
        )}
      </span>

      <span className="text-base leading-snug font-semibold sm:text-xl">{option.text}</span>

      {result && (
        <span className="flex flex-col gap-2">
          <span className="text-2xl font-extrabold tabular-nums sm:text-3xl">
            {result.percent}%
          </span>
          <span className="h-2 w-full overflow-hidden rounded-full bg-line">
            <span
              className={`bar-grow block h-full rounded-full ${isPicked ? "bg-accent" : "bg-muted"}`}
              style={{ width: `${result.percent}%` }}
            />
          </span>
        </span>
      )}
    </button>
  );
}
