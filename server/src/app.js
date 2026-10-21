import fs from "node:fs";
import path from "node:path";
import express from "express";
import cookieParser from "cookie-parser";
import { handleErrors, httpError } from "./errors.js";
import { identifyPlayer } from "./middleware/player.js";
import dilemmasRouter from "./routes/dilemmas.js";
import playersRouter from "./routes/players.js";
import submissionsRouter from "./routes/submissions.js";
import adminRouter from "./routes/admin.js";

const clientBuildFolder = path.resolve(import.meta.dirname, "..", "..", "client", "dist");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// API
app.use("/api", identifyPlayer);
app.use("/api/dilemmas", dilemmasRouter);
app.use("/api/players", playersRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/admin", adminRouter);
app.use("/api", () => {
  throw httpError(404, "This API endpoint does not exist.");
});

// The built React app. In development, Vite serves it instead.
if (fs.existsSync(clientBuildFolder)) {
  app.use(express.static(clientBuildFolder));
  // React handles page routes such as /play, so every other path gets index.html.
  app.get("/{*path}", (req, res) => {
    res.sendFile(path.join(clientBuildFolder, "index.html"));
  });
}

app.use(handleErrors);

export default app;
