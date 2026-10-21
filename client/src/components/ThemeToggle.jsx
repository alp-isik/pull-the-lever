import { useState } from "react";
import { iconButton } from "./styles.js";

// public/theme.js sets the start mode on <html data-theme="..."> before the page draws.
// This button switches it and saves the choice under the same "theme" key.

function saveTheme(theme) {
  // localStorage can throw, for example when the browser blocks site data.
  // Then the mode still changes, but only until the page reloads.
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Nothing to do.
  }
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinejoin="round" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || "light");
  const nextTheme = theme === "dark" ? "light" : "dark";

  function switchTheme() {
    document.documentElement.dataset.theme = nextTheme;
    saveTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className={iconButton}
      onClick={switchTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {/* Show the mode the button switches to. */}
      {nextTheme === "dark" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
