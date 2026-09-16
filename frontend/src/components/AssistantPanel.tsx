import { useState } from "react";

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
  serviceType: string;
}

export default function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("You can ask me what any field means, or switch to Voice assistant when you are ready.");

  if (!open) return null;

  const ask = () => {
    const question = input.trim();
    if (!question) return;
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes("income")) {
      setAnswer("Enter the total annual income of your family in rupees. Add agriculture, salary, and other income first.");
    } else if (lowerQuestion.includes("purpose")) {
      setAnswer("Write why you need the certificate, for example education, scholarship, or a government benefit.");
    } else if (lowerQuestion.includes("aadhaar")) {
      setAnswer("Enter the 12-digit Aadhaar number if it is requested by your service. It is optional in this sample form.");
    } else {
      setAnswer("That field should contain the information asked for in its label. You can also use Voice assistant and I will ask one question at a time.");
    }
    setInput("");
  };

  return (
    <>
      <div className="assistant-overlay" onClick={onClose} />
      <aside className="assistant-drawer helper-drawer">
        <div className="drawer-header">
          <div className="drawer-brand">
            <div className="drawer-ai-icon">V<span /></div>
            <div><strong>VisionAI Helper</strong><small><i /> Form guidance</small></div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close helper">×</button>
        </div>
        <div className="helper-conversation">
          <div className="conversation-row ai">
            <div className="conversation-avatar">AI</div>
            <div className="conversation-content"><small>VISIONAI</small><div className="conversation-bubble">{answer}</div></div>
          </div>
        </div>
        <div className="assistant-control helper-control">
          <p>Ask about a field in simple language.</p>
          <div className="assistant-input">
            <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && ask()} placeholder="Ask about this form..." aria-label="Ask VisionAI" />
            <button onClick={ask} aria-label="Ask question">↑</button>
          </div>
        </div>
      </aside>
    </>
  );
}
