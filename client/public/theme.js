// Set the color mode before the page draws, so it does not flash the wrong colors.
// The player's saved choice wins. Without one, follow the system setting.
// This is a file, not a script inside index.html, because the server's Content Security Policy blocks inline scripts.
// ThemeToggle.jsx saves the choice under the same "theme" key.

function readSavedTheme() {
  // localStorage can throw, for example when the browser blocks site data.
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function prefersDarkMode() {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return true;
  }
  return false;
}

function findStartTheme() {
  const savedTheme = readSavedTheme();
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  if (prefersDarkMode()) {
    return "dark";
  }
  return "light";
}

document.documentElement.dataset.theme = findStartTheme();
