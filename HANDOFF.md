# Handoff

## Goal

1. Make the red look the same in light and dark mode.
2. Fix the bugs from the code review (list below).
3. Show the real number of people on a track ("zoom out"), not at most 5.

## Done

- Closed game: only the admin adds dilemmas. Players send ideas in a suggestion box.
- Fixed answers: "Do nothing" (straight track) or "Pull the lever" (side track). 25 serious starter dilemmas.
- Drawing: people tied to the tracks with labels, X eyes and cartoon blood when hit, a trolley with one wagon, a lever operator, and a switch that bends into the curve.
- ESLint added (`npm run lint`). README and screenshots are up to date. 26 API tests pass.

## Open

- **Red:** `--color-accent` is already `#d7263d` in both modes. Ask Alp what looks different. Likely the trolley's outline (dark in light mode, light in dark mode) or the switch rails.
- **Review bugs:**
  - A player gets stuck when the admin deletes the dilemma they are on (vote returns 404, no way forward).
  - The drawing jumps to the other track mid-drive when the server keeps an older vote.
  - The suggestion rate-limit test does not test the limit of 10 (earlier tests use up 4 requests).
  - `deleteDilemma` and `deleteSuggestion` do the same job in two ways.
  - An old database with the old columns starts, then fails on every request. Before a real deploy, add migrations (see IDEAS.md).
  - Smaller: the hand-measured curve length 148, `matchMedia` called many times per render, the admin page reloading both lists after an add, and "Do nothing"/"Pull the lever" stored in every Option row.
- **Zoom out:** decide the new maximum (10?). Change `MAX_PEOPLE_ON_TRACK` in both limit files, draw smaller people when there are many, and set the real counts in `dilemmas.json` ("10 people", "100 people").
- **Demo data:** the script that fills `server/data/demo.db` with 640 fake players lives only in a temp folder on the work PC. On another device, add it as `npm run demo` if you need the demo.
- About 40 files are not committed yet (state at the time of writing).

## Files

- [client/src/components/TrackFork.jsx](client/src/components/TrackFork.jsx): the whole drawing: tracks, switch, lever, train, people, splashes.
- [client/src/index.css](client/src/index.css): colors for both modes and the animations.
- [client/src/pages/PlayPage.jsx](client/src/pages/PlayPage.jsx): the game flow and the vote.
- [server/src/services/dilemmas.js](server/src/services/dilemmas.js) and [server/src/services/suggestions.js](server/src/services/suggestions.js)
- [server/src/validation.js](server/src/validation.js) and [client/src/limits.js](client/src/limits.js): the limits. Change both together.
- [server/src/db/dilemmas.json](server/src/db/dilemmas.json): the starter dilemmas.
- [server/test/api.test.js](server/test/api.test.js)
- [IDEAS.md](IDEAS.md): parked ideas.

## Skills

- `code-review`: check the fixes.
- `commit-push`: save the work.
- `sync-github`: when the session is done.
