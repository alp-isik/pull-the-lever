import { Link, NavLink, Outlet } from "react-router";

function navLinkClass({ isActive }) {
  const baseClass = "rounded-full px-4 py-2 text-sm font-semibold transition";
  if (isActive) {
    return `${baseClass} bg-ink text-paper`;
  }
  return `${baseClass} hover:bg-line/60`;
}

export default function Layout() {
  return (
    // The page is exactly one screen high, and only <main> scrolls.
    // Then the Play page can share out the screen height and fit without scrolling.
    <div className="flex h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-4xl shrink-0 items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-base font-extrabold tracking-tight whitespace-nowrap sm:text-lg"
        >
          <img src="/favicon.svg" alt="" className="size-8" />
          Pull the Lever
        </Link>
        <nav className="flex gap-1">
          <NavLink to="/play" className={navLinkClass}>
            Play
          </NavLink>
          <NavLink to="/submit" className={navLinkClass}>
            Submit
          </NavLink>
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
