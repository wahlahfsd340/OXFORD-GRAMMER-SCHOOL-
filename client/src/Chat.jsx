import { useRef, useEffect, useState } from "react";
import { useApp, api } from "./lib.js";
export default function Chat() {
  const { t } = useApp(),
    [open, setOpen] = useState(false),
    [ms, setMs] = useState([]),
    [q, setQ] = useState(""),
    [busy, setBusy] = useState(false),
    end = useRef();
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "end" });
  }, [ms, open]);
  const send = async (text) => {
    text = text.trim();
    if (!text || busy) return;
    setBusy(true);
    setQ("");
    const h = ms.map((x) => ({ r: x.r, c: x.c }));
    setMs((m) => [...m, { r: "u", c: text }, { r: "a", c: "..." }]);
    let reply;
    try {
      reply = (await api("/chat", "POST", { m: text, h })).reply;
    } catch (e) {
      reply = "Network error. Please try again.";
    }
    setMs((m) => [...m.slice(0, -1), { r: "a", c: reply }]);
    setBusy(false);
  };
  return (
    <>
      <button id="aib" aria-label="AI assistant" onClick={() => setOpen(!open)}>
        🤖
      </button>
      {open && (
        <div id="aiw">
          <div id="aih">
            <span>🤖 AI Assistant</span>
            <span id="aix" onClick={() => setOpen(false)}>
              ×
            </span>
          </div>
          <div id="aim">
            <div className="ai a" dir="auto">
              {t(
                "Assalam o Alaikum! Ask me anything about our school, in any language.",
              )}
            </div>
            {ms.map((x, i) => (
              <div key={i} className={"ai " + x.r} dir="auto">
                {x.c}
              </div>
            ))}
            <span ref={end} />
          </div>
          {!ms.length && (
            <div id="aic">
              {[
                "How do I apply for admission?",
                "School timings?",
                "Any seats or jobs open?",
              ].map((s) => (
                <button key={s} onClick={() => send(t(s))}>
                  {t(s)}
                </button>
              ))}
            </div>
          )}
          <div id="aif">
            <input
              value={q}
              maxLength={600}
              placeholder={t("Type your question...")}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key == "Enter" && send(q)}
            />
            <button onClick={() => send(q)} aria-label="Send">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
