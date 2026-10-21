// Every call to the Express API goes through this file.

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // The server sent no JSON, for example when it is not running.
    return {};
  }
}

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.error || "Could not reach the server. Try again.");
  }
  return data;
}

function sendJson(method, path, body) {
  return request(path, { method, body: JSON.stringify(body) });
}

// Game

export function getDilemmas() {
  return request("/dilemmas");
}

export function sendVote(dilemmaId, optionId) {
  return sendJson("POST", `/dilemmas/${dilemmaId}/votes`, { optionId });
}

export function getPlayerSummary() {
  return request("/players/me/summary");
}

export function submitDilemma(text, options) {
  return sendJson("POST", "/submissions", { text, options });
}

// Admin

export function getAdminSession() {
  return request("/admin/session");
}

export function loginAsAdmin(password) {
  return sendJson("POST", "/admin/login", { password });
}

export function logoutAdmin() {
  return sendJson("POST", "/admin/logout", {});
}

export function getSubmissions() {
  return request("/admin/submissions");
}

export function reviewSubmission(dilemmaId, status) {
  return sendJson("PATCH", `/admin/submissions/${dilemmaId}`, { status });
}
