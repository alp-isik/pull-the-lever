// Tailwind classes that several pages share, so every button and field looks the same.

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-accent hover:text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink px-6 py-3 font-semibold transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

// Bigger versions for the main choices on a screen, such as Play and Submit on the front page.
export const largePrimaryButton = `${primaryButton} px-10 text-lg`;

export const largeSecondaryButton = `${secondaryButton} text-lg`;

// A smaller version for actions inside a list, such as Delete on the admin page.
export const smallSecondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

// A round button that shows only an icon, such as the light and dark mode switch.
export const iconButton =
  "inline-flex size-10 items-center justify-center rounded-full border-2 border-line transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const textField =
  "w-full rounded-xl border-2 border-line bg-card px-4 py-3 text-base transition placeholder:text-muted/70 focus:border-ink focus:outline-none";

export const card = "rounded-2xl border-2 border-line bg-card p-6";
