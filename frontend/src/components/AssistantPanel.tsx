import { useState } from "react";

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function AssistantPanel({
  open,
  onClose,
}: AssistantPanelProps) {
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState<"EN" | "TA">("EN");
  const [input, setInput] = useState("");

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="assistant-overlay"
        onClick={onClose}
      />

      <aside className="assistant-drawer">

        {/* HEADER */}
        <div className="drawer-header">

          <div className="drawer-brand">

            <div className="drawer-ai-icon">
              V

              <span />
            </div>

            <div>
              <strong>
                VisionAI Assistant
              </strong>

              <small>
                <i />
                Conversation ready
              </small>
            </div>

          </div>

          <button
            className="drawer-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        {/* STATE */}
        <div className="assistant-state">

          <div className="assistant-state-title">
            <span />
            ACTIVE SESSION
          </div>

          <div className="assistant-language">

            <button
              className={
                language === "EN"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLanguage("EN")
              }
            >
              English
            </button>

            <button
              className={
                language === "TA"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLanguage("TA")
              }
            >
              தமிழ்
            </button>

          </div>

        </div>

        {/* CHAT */}
        <div className="conversation-area">

          <div className="conversation-date">
            TODAY
          </div>

          <div className="conversation-row ai">

            <div className="conversation-avatar">
              AI
            </div>

            <div className="conversation-content">

              <small>
                VisionAI
              </small>

              <div className="conversation-bubble">
                {language === "EN"
                  ? "Hello. Tell me which government service you need help with."
                  : "வணக்கம். எந்த அரசு சேவைக்கு உதவி வேண்டும்?"}
              </div>

            </div>

          </div>

          <div className="conversation-row user">

            <div className="conversation-bubble">
              I want to apply for an income certificate.
            </div>

          </div>

          <div className="conversation-row ai">

            <div className="conversation-avatar">
              AI
            </div>

            <div className="conversation-content">

              <small>
                VisionAI
              </small>

              <div className="conversation-bubble">
                I found the Income Certificate
                workflow. I will guide you through
                the required information one step
                at a time.
              </div>

            </div>

          </div>

          <div className="conversation-row ai">

            <div className="conversation-avatar">
              AI
            </div>

            <div className="conversation-content">

              <small>
                NEXT QUESTION
              </small>

              <div className="question-bubble">
                What is your full name?
              </div>

            </div>

          </div>

        </div>

        {/* VOICE */}
        <div className="assistant-control">

          {listening && (
            <div className="listening-indicator">
              <span />

              Listening for your response...
            </div>
          )}

          <button
            className={
              listening
                ? "voice-control active"
                : "voice-control"
            }
            onClick={() =>
              setListening((value) => !value)
            }
          >

            <span className="voice-ripple" />

            ◉

          </button>

          <h4>
            {listening
              ? "Listening..."
              : "Tap to speak"}
          </h4>

          <p>
            You can answer in English or தமிழ்.
          </p>

          {/* TEXT INPUT */}
          <div className="assistant-input">

            <input
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder="Type instead..."
            />

            <button
              onClick={() => setInput("")}
            >
              ↑
            </button>

          </div>

        </div>

      </aside>
    </>
  );
}