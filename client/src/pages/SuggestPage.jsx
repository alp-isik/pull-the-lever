import { useState } from "react";
import { sendSuggestion } from "../api.js";
import Notice from "../components/Notice.jsx";
import { card, primaryButton, textField } from "../components/styles.js";
import { MAX_SUGGESTION_LENGTH } from "../limits.js";

// Players send ideas in their own words. The admin reads them and may turn one into a dilemma.
export default function SuggestPage() {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSending(true);
    setErrorMessage(null);
    setIsSent(false);
    try {
      await sendSuggestion(text);
      setText("");
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
        <h1 className="text-4xl font-extrabold tracking-tight">Suggest a dilemma</h1>
        <p className="text-muted">
          Who is on the tracks? Describe your idea in a few words. If it fits the game, it may show
          up in a later version.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={`${card} flex flex-col gap-5`}>
        <label className="flex flex-col gap-2">
          <span className="flex justify-between font-semibold">
            Your idea
            <span className="text-sm font-normal text-muted tabular-nums">
              {text.length}/{MAX_SUGGESTION_LENGTH}
            </span>
          </span>
          <textarea
            name="text"
            rows="4"
            required
            maxLength={MAX_SUGGESTION_LENGTH}
            placeholder="A trolley is heading toward five people. Pull the lever and it hits…"
            className={textField}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        {errorMessage && <Notice tone="error">{errorMessage}</Notice>}
        {isSent && <Notice tone="success">Thanks! Your idea is on its way.</Notice>}

        <button type="submit" className={`${primaryButton} self-start`} disabled={isSending}>
          {isSending ? "Sending…" : "Send it"}
        </button>
      </form>
    </section>
  );
}
