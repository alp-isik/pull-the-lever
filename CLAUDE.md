# Pull the Lever: project rules

Read the README for the setup, commands and API.

- Use plain JavaScript (ES modules), not TypeScript.
- The client calls the API only through `client/src/api.js`.
- Put shared Tailwind classes in `client/src/components/styles.js`. Do not write a new button style in a page.
- The server keeps game logic in `server/src/services/`. Route files only read the request, check it, call a service and send the response.
- Throw `httpError(status, message)` for client errors. Express 5 sends errors from async routes to the error handler.
- The text limits are in `server/src/validation.js` and are copied in `client/src/limits.js`. Change both together.
- Add an API test in `server/test/` for every new endpoint. Run `npm test` before you commit.
- Run `npm run format` and `npm run lint` before you commit.
