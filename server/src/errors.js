// Make an error that the error handler sends to the client with this status and message.
export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Send client errors (4xx) as they are. Hide the details of server errors (5xx).
// Express knows an error handler by its 4 parameters, so keep "next" although it is not used.
export function handleErrors(error, req, res, next) {
  const status = error.status || 500;
  if (status < 500) {
    return res.status(status).json({ error: error.message });
  }

  console.error(error);
  res.status(500).json({ error: "Something went wrong on the server." });
}
