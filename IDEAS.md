# Ideas for later

Work we parked. Nothing here is planned yet.

## Features

- **Share your verdict.** A button on the end screen that copies a short text, for example "12 mainstream, 4 close calls, 9 hot takes".
- **Shorter rounds.** With many dilemmas, one game plays all of them. A round could be 10 dilemmas the player has not answered yet.
- **Edit a dilemma.** The admin page can add and delete dilemmas, but not change one. A fix now means delete and add again, which loses the votes.
- **Zoom out.** Show the real number of people on a track, for example 100, not at most 5. Draw smaller people when there are many.

## Known issues

- A player gets stuck if the admin deletes the dilemma they are on: the vote returns 404 and there is no way forward.
- The drawing can jump to the other track mid-drive when the server keeps an older vote.
- The suggestion rate-limit test does not test the limit of 10, because earlier tests use up 4 requests.
- `deleteDilemma` and `deleteSuggestion` do the same job in two different ways.
- Smaller: the curve length 148 is measured by hand, `matchMedia` runs many times per render, and the admin page reloads both lists after an add.

## Project

- **CI.** A GitHub Actions workflow that runs `npm run lint`, `npm test`, `npm run build` and `prettier --check .` on every push. Add a status badge to the README.
- **Live demo.** Deploy the app and put the link at the top of the README. Set `NODE_ENV=production` and `TRUST_PROXY=1` on the host.
- **Database migrations.** Today a model change means a new database, so all votes are lost. Before a real deploy, add migrations (scripts that change the tables but keep the data).
