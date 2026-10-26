import { useEffect, useState } from "react";
import {
  addDilemma,
  deleteDilemma,
  deleteSuggestion,
  getAdminSession,
  getDilemmas,
  getSuggestions,
  loginAsAdmin,
  logoutAdmin,
} from "../api.js";
import Notice from "../components/Notice.jsx";
import {
  card,
  primaryButton,
  secondaryButton,
  smallSecondaryButton,
  textField,
} from "../components/styles.js";
import {
  MAX_DILEMMA_LENGTH,
  MAX_PEOPLE_ON_TRACK,
  MAX_TRACK_LABEL_LENGTH,
  MIN_PEOPLE_ON_TRACK,
} from "../limits.js";

const peopleChoices = [];
for (let count = MIN_PEOPLE_ON_TRACK; count <= MAX_PEOPLE_ON_TRACK; count += 1) {
  peopleChoices.push(count);
}

// The people counts are text here, because a <select> gives text. They become numbers on send.
const emptyDilemmaForm = {
  text: "",
  doNothingLabel: "",
  doNothingPeople: "1",
  pullTheLeverLabel: "",
  pullTheLeverPeople: "1",
};

// Turn the fields of one track into the shape the API expects.
function toTrack(form, answer) {
  return {
    trackLabel: form[`${answer}Label`],
    peopleOnTrack: Number(form[`${answer}People`]),
  };
}

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

// The fields for one track: what stands on it and how many people to draw.
// answer is "doNothing" or "pullTheLever".
function TrackFields({ answer, title, hint, form, onChange }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-semibold">{title}</legend>
      <p className="text-sm text-muted">{hint}</p>
      <label className="flex flex-col gap-1">
        <span className="text-sm">Who is on this track?</span>
        <input
          name={`${answer}Label`}
          required
          maxLength={MAX_TRACK_LABEL_LENGTH}
          placeholder={answer === "doNothing" ? "5 people" : "1 person"}
          className={textField}
          value={form[`${answer}Label`]}
          onChange={onChange}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm">People to draw</span>
        <select
          name={`${answer}People`}
          className={textField}
          value={form[`${answer}People`]}
          onChange={onChange}
        >
          {peopleChoices.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

function AddDilemmaForm({ onAdded }) {
  const [form, setForm] = useState(emptyDilemmaForm);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSending(true);
    setErrorMessage(null);
    try {
      await addDilemma(form.text, toTrack(form, "doNothing"), toTrack(form, "pullTheLever"));
      setForm(emptyDilemmaForm);
      onAdded();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} flex flex-col gap-5`}>
      <label className="flex flex-col gap-2">
        <span className="flex justify-between font-semibold">
          The dilemma
          <span className="text-sm font-normal text-muted tabular-nums">
            {form.text.length}/{MAX_DILEMMA_LENGTH}
          </span>
        </span>
        <textarea
          name="text"
          rows="3"
          required
          maxLength={MAX_DILEMMA_LENGTH}
          placeholder="A trolley is heading toward five people. Pull the lever and it hits…"
          className={textField}
          value={form.text}
          onChange={updateField}
        />
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <TrackFields
          answer="doNothing"
          title="Do nothing"
          hint="The straight track: who the trolley hits if nobody acts."
          form={form}
          onChange={updateField}
        />
        <TrackFields
          answer="pullTheLever"
          title="Pull the lever"
          hint="The side track: who the trolley hits if the player pulls."
          form={form}
          onChange={updateField}
        />
      </div>

      {errorMessage && <Notice tone="error">{errorMessage}</Notice>}

      <button type="submit" className={`${primaryButton} self-start`} disabled={isSending}>
        {isSending ? "Adding…" : "Add to the game"}
      </button>
    </form>
  );
}

function SuggestionList({ suggestions, onDone }) {
  if (suggestions.length === 0) {
    return <Notice>No suggestions yet.</Notice>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {suggestions.map((suggestion) => (
        <li key={suggestion.id} className={`${card} flex items-start justify-between gap-4`}>
          <p className="whitespace-pre-line">{suggestion.text}</p>
          <button
            type="button"
            className={`${smallSecondaryButton} shrink-0`}
            onClick={() => onDone(suggestion.id)}
          >
            Done
          </button>
        </li>
      ))}
    </ul>
  );
}

function DilemmaList({ dilemmas, onDelete }) {
  if (dilemmas.length === 0) {
    return <Notice>The game has no dilemmas yet.</Notice>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {dilemmas.map((dilemma, index) => (
        <li key={dilemma.id} className={`${card} flex items-start justify-between gap-4`}>
          <div className="flex flex-col gap-1">
            <p className="font-semibold">
              {index + 1}. {dilemma.text}
            </p>
            <p className="text-sm text-muted">
              {dilemma.options
                .map((option) => `${option.text}: ${option.trackLabel} (${option.peopleOnTrack})`)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            className={`${smallSecondaryButton} shrink-0`}
            onClick={() => onDelete(dilemma.id)}
          >
            Delete
          </button>
        </li>
      ))}
    </ol>
  );
}

export default function AdminPage() {
  // null while we check the session, then true or false.
  const [isAdmin, setIsAdmin] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [dilemmas, setDilemmas] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  async function loadAdminData() {
    try {
      const [suggestionList, dilemmaList] = await Promise.all([getSuggestions(), getDilemmas()]);
      setSuggestions(suggestionList);
      setDilemmas(dilemmaList);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    getAdminSession()
      .then((session) => {
        setIsAdmin(session.isAdmin);
        if (session.isAdmin) {
          loadAdminData();
        }
      })
      .catch((error) => setErrorMessage(error.message));
  }, []);

  function handleLogin() {
    setIsAdmin(true);
    loadAdminData();
  }

  async function handleLogout() {
    setErrorMessage(null);
    try {
      await logoutAdmin();
      setIsAdmin(false);
      setSuggestions([]);
      setDilemmas([]);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleSuggestionDone(suggestionId) {
    setErrorMessage(null);
    try {
      await deleteSuggestion(suggestionId);
      // Filter the newest list, not the list from the time of the click.
      // Then two quick clicks do not bring a removed item back.
      setSuggestions((currentSuggestions) =>
        currentSuggestions.filter((suggestion) => suggestion.id !== suggestionId),
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDeleteDilemma(dilemmaId) {
    if (!window.confirm("Delete this dilemma? Its votes are deleted too.")) {
      return;
    }

    setErrorMessage(null);
    try {
      await deleteDilemma(dilemmaId);
      setDilemmas((currentDilemmas) =>
        currentDilemmas.filter((dilemma) => dilemma.id !== dilemmaId),
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <section className="flex flex-col gap-8 pt-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Admin</h1>
        {isAdmin && (
          <button type="button" className={secondaryButton} onClick={handleLogout}>
            Log out
          </button>
        )}
      </header>

      {errorMessage && <Notice tone="error">{errorMessage}</Notice>}
      {isAdmin === false && <LoginForm onLogin={handleLogin} />}

      {isAdmin && (
        <>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Add a dilemma</h2>
            <AddDilemmaForm onAdded={loadAdminData} />
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Suggestions from players</h2>
            <SuggestionList suggestions={suggestions} onDone={handleSuggestionDone} />
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">In the game ({dilemmas.length})</h2>
            <DilemmaList dilemmas={dilemmas} onDelete={handleDeleteDilemma} />
          </div>
        </>
      )}
    </section>
  );
}
