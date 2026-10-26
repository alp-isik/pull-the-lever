import fs from "node:fs";
import path from "node:path";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import config from "./config.js";
import { handleErrors, httpError } from "./errors.js";
import { identifyPlayer } from "./middleware/player.js";
import dilemmasRouter from "./routes/dilemmas.js";
import playersRouter from "./routes/players.js";
import suggestionsRouter from "./routes/suggestions.js";
import adminRouter from "./routes/admin.js";

const clientBuildFolder = path.resolve(import.meta.dirname, "..", "..", "client", "dist");

// A page route such as /play has no file extension. A file such as /assets/app.js has one.
function isPageRoute(req) {
  if (path.extname(req.path) === "") {
    return true;
  }
  return false;
}

const app = express();

if (config.trustProxyHops > 0) {
  // Read the player's real IP address from the proxy's X-Forwarded-For header.
  app.set("trust proxy", config.trustProxyHops);
}

// helmet sets security headers, for example a Content Security Policy that blocks scripts from other sites.
// It also removes the X-Powered-By header.
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// API
app.use("/api", identifyPlayer);
app.use("/api/dilemmas", dilemmasRouter);
app.use("/api/players", playersRouter);
app.use("/api/suggestions", suggestionsRouter);
app.use("/api/admin", adminRouter);
app.use("/api", () => {
  throw httpError(404, "This API endpoint does not exist.");
});

// The built React app. In development, Vite serves it instead.
if (fs.existsSync(clientBuildFolder)) {
  app.use(express.static(clientBuildFolder));
  // React handles page routes such as /play, so they get index.html.
  // A missing file gets a 404, not the page.
  app.get("/{*path}", (req, res, next) => {
    if (!isPageRoute(req)) {
      return next();
    }
    res.sendFile(path.join(clientBuildFolder, "index.html"));
  });
}

app.use(handleErrors);

export default app;
