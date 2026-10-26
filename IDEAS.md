# Ideas for later

Work we parked. Nothing here is planned yet.

## Features

- **Share your verdict.** A button on the end screen that copies a short text, for example "12 mainstream, 4 close calls, 9 hot takes".
- **Shorter rounds.** With many dilemmas, one game plays all of them. A round could be 10 dilemmas the player has not answered yet.
- **Edit a dilemma.** The admin page can add and delete dilemmas, but not change one. A fix now means delete and add again, which loses the votes.

## Project

- **CI.** A GitHub Actions workflow that runs `npm run lint`, `npm test`, `npm run build` and `prettier --check .` on every push. Add a status badge to the README.
- **Live demo.** Deploy the app and put the link at the top of the README. Set `NODE_ENV=production` and `TRUST_PROXY=1` on the host.
- **Database migrations.** Today a model change means a new database, so all votes are lost. Before a real deploy, add migrations (scripts that change the tables but keep the data).
