# Pull the Lever

A game of small and silly dilemmas, inspired by [Absurd Trolley Problems](https://neal.fun/absurd-trolley-problems/).

Each dilemma has two options. You pick one, the trolley takes that track, and you see how many other players chose the same. At the end you get your verdict: how many of your picks were mainstream, close calls or hot takes.

Players can submit their own dilemmas. An admin approves them before they go into the game.

## Stack

- **Client:** React, Vite, Tailwind CSS, React Router
- **Server:** Express 5 JSON API, Sequelize, SQLite
- **Tests:** Vitest and Supertest (API tests)

Players do not log in. Each browser gets a random player ID in a cookie, and votes are saved under that ID. Only the admin logs in, with a password from `.env`.

## Get started

You need Node.js 22 or newer.

1. Install the packages:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`. Fill in `ADMIN_PASSWORD` and `JWT_SECRET`.

3. Add the starter dilemmas to the database:

   ```bash
   npm run seed
   ```

4. Start the server and the client:

   ```bash
   npm run dev
   ```

5. Open http://localhost:5173.

The admin page has no link in the game. Open http://localhost:5173/admin and log in with `ADMIN_PASSWORD`.

## Commands

Run these from the project root.

| Command          | What it does                                                  |
| ---------------- | ------------------------------------------------------------- |
| `npm run dev`    | Starts the API on port 3000 and the client on port 5173.      |
| `npm run seed`   | Adds the starter dilemmas, but only if the database is empty. |
| `npm test`       | Runs the API tests on a separate database in memory.          |
| `npm run build`  | Builds the client into `client/dist`.                         |
| `npm start`      | Starts the server. It also serves `client/dist` if it exists. |
| `npm run format` | Formats every file with Prettier.                             |

To run it in production: run `npm run build`, then `npm start`, with `NODE_ENV=production`. Then one server on one port serves both the API and the game.

## Project structure

```
client/                 React app
  src/api.js            Every call to the API
  src/pages/            One file for each page (Home, Play, Submit, Admin)
  src/components/       Shared parts: layout, track drawing, option cards, end screen
server/                 Express API
  src/app.js            Routes and middleware
  src/server.js         Starts the server
  src/config.js         Every setting from .env
  src/models/           Dilemma, Option and Vote tables
  src/routes/           One file for each group of endpoints
  src/services/         Game logic: results, player summary
  src/db/dilemmas.json  The starter dilemmas
  test/                 API tests
```

## API

All endpoints start with `/api`. Errors come back as `{ "error": "message" }`.

| Method | Path                     | What it does                                                             |
| ------ | ------------------------ | ------------------------------------------------------------------------ |
| GET    | `/dilemmas`              | Lists approved dilemmas, with the option this player picked.             |
| POST   | `/dilemmas/:id/votes`    | Saves a vote: `{ "optionId": 1 }`. Returns the results.                  |
| GET    | `/players/me/summary`    | Shows how often this player agreed with everyone else.                   |
| POST   | `/submissions`           | Submits a dilemma: `{ "text": "...", "options": ["A", "B"] }`.           |
| POST   | `/admin/login`           | Logs in as admin: `{ "password": "..." }`.                               |
| POST   | `/admin/logout`          | Logs out.                                                                |
| GET    | `/admin/session`         | Returns `{ "isAdmin": true }` or `{ "isAdmin": false }`.                 |
| GET    | `/admin/submissions`     | Admin only. Lists submissions that wait for review.                      |
| PATCH  | `/admin/submissions/:id` | Admin only. Sets the status: `{ "status": "approved" }` or `"rejected"`. |

A player can vote only once on each dilemma. A second vote keeps the first answer.

## Results

A pick counts once its dilemma has at least 5 votes:

- **Mainstream:** 60% or more of players agreed.
- **Close call:** between 41% and 59% agreed.
- **Hot take:** 40% or fewer agreed.

## Security

- The admin password and the JWT secret come from `.env`. The server does not start without them.
- The admin login token is kept in an httpOnly cookie, so page scripts cannot read it. It expires after 8 hours.
- Rate limits count requests per IP address:
  - Admin login: 5 failed attempts per 15 minutes.
  - Submissions: 10 per hour.
- The limits are kept in memory, so they reset when the server restarts.
- Behind a hosting proxy, every request seems to come from the proxy's IP address. Add `app.set("trust proxy", 1)` in `server/src/app.js` when you deploy, so the limits see each player's real IP address.
