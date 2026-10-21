import { useState } from "react";
import { submitDilemma } from "../api.js";
import Notice from "../components/Notice.jsx";
import { card, primaryButton, textField } from "../components/styles.js";

// Same limits as the server (server/src/validation.js).
const MAX_DILEMMA_LENGTH = 200;
const MAX_OPTION_LENGTH = 60;

const emptyForm = { text: "", topOption: "", bottomOption: "" };

export default function SubmitPage() {
  const [form, setForm] = useState(emptyForm);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSent, setIsSent] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSending(true);
    setErrorMessage(null);
    setIsSent(false);
    try {
      await submitDilemma(form.text, [form.topOption, form.bottomOption]);
      setForm(emptyForm);
      setIsSent(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-6 pt-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Submit a dilemma</h1>
        <p className="text-muted">
          Write a choice with two sides. An admin reads every submission before it goes into the
          game.
        </p>
      </header>

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
            placeholder="Would you rather…"
            className={textField}
            value={form.text}
            onChange={updateField}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-semibold">Top track</span>
            <input
              name="topOption"
              required
              maxLength={MAX_OPTION_LENGTH}
              className={textField}
              value={form.topOption}
              onChange={updateField}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-semibold">Bottom track</span>
            <input
              name="bottomOption"
              required
              maxLength={MAX_OPTION_LENGTH}
              className={textField}
              value={form.bottomOption}
              onChange={updateField}
            />
          </label>
        </div>

        {errorMessage && <Notice tone="error">{errorMessage}</Notice>}
        {isSent && <Notice tone="success">Thanks! Your dilemma is waiting for review.</Notice>}

        <button type="submit" className={`${primaryButton} self-start`} disabled={isSending}>
          {isSending ? "Sending…" : "Send it"}
        </button>
      </form>
    </section>
  );
}
