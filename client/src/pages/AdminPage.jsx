import { useEffect, useState } from "react";
import {
  getAdminSession,
  getSubmissions,
  loginAsAdmin,
  logoutAdmin,
  reviewSubmission,
} from "../api.js";
import Notice from "../components/Notice.jsx";
import { card, primaryButton, secondaryButton, textField } from "../components/styles.js";

function LoginForm({ onLogin }) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage(null);
    try {
      await loginAsAdmin(password);
      onLogin();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} flex max-w-sm flex-col gap-4`}>
      <label className="flex flex-col gap-2">
        <span className="font-semibold">Admin password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          className={textField}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {errorMessage && <Notice tone="error">{errorMessage}</Notice>}
      <button type="submit" className={`${primaryButton} self-start`}>
        Log in
      </button>
    </form>
  );
}

function SubmissionCard({ submission, onReview }) {
  return (
    <li className={`${card} flex flex-col gap-4`}>
      <p className="text-lg font-semibold">{submission.text}</p>
      <p className="text-muted">
        {submission.options[0].text} <span className="px-1">/</span> {submission.options[1].text}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          className={primaryButton}
          onClick={() => onReview(submission.id, "approved")}
        >
          Approve
        </button>
        <button
          type="button"
          className={secondaryButton}
          onClick={() => onReview(submission.id, "rejected")}
        >
          Reject
        </button>
      </div>
    </li>
  );
}

export default function AdminPage() {
  // null while we check the session, then true or false.
  const [isAdmin, setIsAdmin] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  async function loadSubmissions() {
    try {
      setSubmissions(await getSubmissions());
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    getAdminSession()
      .then((session) => {
        setIsAdmin(session.isAdmin);
        if (session.isAdmin) {
          loadSubmissions();
        }
      })
      .catch((error) => setErrorMessage(error.message));
  }, []);

  function handleLogin() {
    setIsAdmin(true);
    loadSubmissions();
  }

  async function handleLogout() {
    setErrorMessage(null);
    try {
      await logoutAdmin();
      setIsAdmin(false);
      setSubmissions([]);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleReview(dilemmaId, status) {
    setErrorMessage(null);
    try {
      await reviewSubmission(dilemmaId, status);
      // Filter the newest list, not the list from the time of the click.
      // Then two quick reviews do not bring a removed card back.
      setSubmissions((currentSubmissions) =>
        currentSubmissions.filter((submission) => submission.id !== dilemmaId),
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <section className="flex flex-col gap-6 pt-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Review submissions</h1>
        {isAdmin && (
          <button type="button" className={secondaryButton} onClick={handleLogout}>
            Log out
          </button>
        )}
      </header>

      {errorMessage && <Notice tone="error">{errorMessage}</Notice>}
      {isAdmin === false && <LoginForm onLogin={handleLogin} />}
      {isAdmin && submissions.length === 0 && <Notice>No submissions are waiting.</Notice>}
      {isAdmin && submissions.length > 0 && (
        <ul className="flex flex-col gap-4">
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} onReview={handleReview} />
          ))}
        </ul>
      )}
    </section>
  );
}
