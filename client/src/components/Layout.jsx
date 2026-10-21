import { Link, Outlet } from "react-router";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Layout() {
  return (
    // The page is exactly one screen high, and only <main> scrolls.
    // Then the Play page can share out the screen height and fit without scrolling.
    <div className="flex h-dvh flex-col">
      {/* The logo on the left, the light and dark mode switch on the right.
          The front page has the Play and Submit buttons. */}
      <header className="mx-auto flex w-full max-w-4xl shrink-0 items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-base font-extrabold tracking-tight whitespace-nowrap sm:text-lg"
        >
          <img src="/favicon.svg" alt="" className="logo-tile size-8" />
          Pull the Lever
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
