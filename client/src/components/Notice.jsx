const toneClasses = {
  error: "border-accent bg-accent-soft",
  success: "border-ink bg-card",
  info: "border-line bg-card",
};

// A short message box: an error, a success or a plain note.
export default function Notice({ tone = "info", children }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border-2 px-4 py-3 text-sm ${toneClasses[tone]}`}
    >
      {children}
    </div>
  );
}
