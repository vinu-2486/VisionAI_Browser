import { useEffect, useRef, useState } from "react";
import { FormField, useFormFlow } from "../hooks/useFormFlow";
import { extractFields, isExitVoiceCommand, isNextCommand, isRepeatCommand, normalizeFieldValue, spokenValue, TAMIL_NADU_CITIES } from "../utils/voiceForm";

interface IncomeCertificatePageProps {
  mode: "manual" | "voice" | null;
  onChooseMode: (mode: "manual" | "voice" | null) => void;
  onOpenHelp: () => void;
}

interface RecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface RecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface RecognitionConstructor {
  new (): RecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

function FormFieldEditor({
  field,
  onChange,
  disabled,
  error,
  highlighted,
  cityEnabled = true,
}: {
  field: FormField;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
  highlighted?: boolean;
  cityEnabled?: boolean;
  sameAddress?: boolean;
}) {
  const multiline = field.id.toLowerCase().includes("address");
  const options = field.id === "gender"
    ? ["Male", "Female", "Transgender", "Prefer not to say"]
    : field.id === "state" ? ["Tamil Nadu"]
      : field.id === "city" ? TAMIL_NADU_CITIES
        : field.id === "maritalStatus" ? ["Single", "Married", "Widowed", "Divorced"] : [];
  const inputType = field.id === "dateOfBirth" ? "date" : field.id === "mobile" || field.id === "pin" || field.id === "aadhaar" || field.id.toLowerCase().includes("income") ? "tel" : "text";
  return (
    <label className={`certificate-field ${highlighted ? "field-updated" : ""} ${error ? "field-invalid" : ""}`}>
      <span>{field.label}{field.required && <sup>*</sup>}</span>
      {options.length ? (
        <select value={field.value} onChange={(event) => onChange(event.target.value)} disabled={disabled || (field.id === "city" && !cityEnabled)}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : multiline ? (
        <textarea value={field.value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={`Enter ${field.label.toLowerCase()}`} />
      ) : (
        <input type={inputType} value={field.value} onChange={(event) => onChange(event.target.value)} disabled={disabled || field.id === "age"} readOnly={field.id === "age"} placeholder={field.id === "age" ? "Calculated from date of birth" : `Enter ${field.label.toLowerCase()}`} />
      )}
      {error && <em role="alert">{error}</em>}
    </label>
  );
}

export default function IncomeCertificatePage({ mode, onChooseMode, onOpenHelp }: IncomeCertificatePageProps) {
  const voiceMode = mode === "voice";
  const [language, setLanguage] = useState<"en" | "ta">("en");
  const [listening, setListening] = useState(false);
  const [lastSpelling, setLastSpelling] = useState("");
  const [sameAddress, setSameAddress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const voiceSupported = Boolean(typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognition = useRef<RecognitionInstance | null>(null);
  const voiceModeRef = useRef(voiceMode);
  const listeningRef = useRef(false);
  const promptGeneration = useRef(0);
  const { fields, currentField, completedCount, formComplete, updateField, applyVoiceInput, messages, busy, error, fieldErrors, highlightedField, statusMessage, validateForSubmit, focusNextMissing } = useFormFlow("income_certificate", language, voiceMode);
  const requiredCount = fields.filter((field) => field.required).length;

  useEffect(() => {
    voiceModeRef.current = voiceMode;
    if (!voiceMode) {
      recognition.current?.stop();
      window.speechSynthesis?.cancel();
      setListening(false);
    }
  }, [voiceMode]);

  useEffect(() => {
    if (voiceMode) focusNextMissing();
  }, [voiceMode]);

  useEffect(() => {
    if (sameAddress) {
      updateField("presentAddress", fields.find((field) => field.id === "permanentAddress")?.value || "");
    }
  }, [sameAddress, fields.find((field) => field.id === "permanentAddress")?.value]);

  useEffect(() => {
    if (!formComplete || showSuccess) return;
    if (validateForSubmit()) {
      setShowSuccess(true);
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.speak(new SpeechSynthesisUtterance(
        "Form filled successfully. Further procedure will be informed soon."
      ));
    }
  }, [formComplete, showSuccess]);

  const speakPromptAndListen = (message: string) => {
    if (!voiceModeRef.current) return;
    const generation = ++promptGeneration.current;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = language === "ta" ? "ta-IN" : "en-IN";
    utterance.onend = () => {
      if (generation === promptGeneration.current && voiceModeRef.current) startListening();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!voiceMode || !currentField || !window.speechSynthesis) return;
    const spokenLabel = currentField.id === "fullName" ? "name" : currentField.label.toLowerCase();
    const options = currentField.id === "gender" ? " The options are Male, Female, Transgender, or Prefer not to say." : currentField.id === "maritalStatus" ? " The options are Single, Married, Widowed, or Divorced." : currentField.id === "state" ? " The available option is Tamil Nadu." : "";
    speakPromptAndListen(language === "ta" ? `தயவுசெய்து உங்கள் ${currentField.label} கூறவும்` : `Please tell your ${spokenLabel}.${options}`);
  }, [currentField?.id, language, voiceMode]);

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || !currentField || !voiceModeRef.current || listeningRef.current) return;
    const instance = new Recognition();
    instance.lang = language === "ta" ? "ta-IN" : "en-IN";
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (event) => {
      const value = event.results[0]?.[0]?.transcript.trim() || "";
      if (!value) return;
      if (isExitVoiceCommand(value)) {
        onChooseMode("manual");
        return;
      }
      if (isNextCommand(value) || isRepeatCommand(value)) {
        const label = currentField?.id === "fullName" ? "name" : currentField?.label.toLowerCase();
        speakPromptAndListen(`Please tell your ${label || "answer"}.`);
        return;
      }
      void applyVoiceInput(value).then((accepted) => {
        if (!accepted) {
          window.setTimeout(() => {
            if (voiceModeRef.current && currentField) {
              speakPromptAndListen(`Please try your ${currentField.label.toLowerCase()} again.`);
            }
          }, 400);
          return;
        }
        const extracted = extractFields(value, currentField?.id);
const capturedId = currentField?.id && extracted[currentField.id] !== undefined ? currentField.id : Object.keys(extracted)[0] || "";
const extractedValue = normalizeFieldValue(capturedId, extracted[capturedId] ?? value);
const spelling = spokenValue(capturedId, extractedValue);
        if (window.speechSynthesis) {
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(spelling));
        }
      });
    };
    instance.onerror = () => { listeningRef.current = false; setListening(false); if (voiceModeRef.current) window.setTimeout(() => startListening(), 500); };
    instance.onend = () => { listeningRef.current = false; setListening(false); };
    recognition.current = instance;
    listeningRef.current = true;
    setListening(true);
    instance.start();
  };

  const renderField = (field: FormField) => (
    <FormFieldEditor key={field.id} field={field} onChange={(value) => updateField(field.id, value)} disabled={voiceMode} error={fieldErrors[field.id]} highlighted={highlightedField === field.id} cityEnabled={Boolean(fields.find((item) => item.id === "state")?.value)} />
  );

  const personalFields = fields.filter((field) => ["fullName", "mobile", "email", "gender", "state", "city", "dateOfBirth", "age", "maritalStatus", "religion"].includes(field.id));
  const addressFields = fields.filter((field) => ["fatherName", "motherName", "aadhaar", "permanentAddress", "presentAddress"].includes(field.id));
  const locationFields = fields.filter((field) => ["policeStation", "postOffice", "district", "pin"].includes(field.id));
  const incomeFields = fields.filter((field) => ["annualIncomeAgriculture", "annualIncomeSalary", "annualIncomeOther", "annualIncome"].includes(field.id));
  const declarationFields = fields.filter((field) => ["purpose", "declarationName"].includes(field.id));

  if (showSuccess) {
    return (
      <section className="certificate-success" role="status" aria-live="polite">
        <div className="success-mark">✓</div>
        <div className="eyebrow">INCOME CERTIFICATE</div>
        <h1>Form filled successfully</h1>
        <p>All required information has been captured. Further procedure will be informed soon.</p>
        <button className="success-return" onClick={() => setShowSuccess(false)}>Review filled form</button>
      </section>
    );
  }

  return (
    <section className="certificate-page">
      <div className="certificate-topbar">
        <div>
          <div className="eyebrow">FORM NO. 3 · GOVERNMENT SERVICE</div>
          <h1>Income Certificate</h1>
          <p>Complete the application with every required detail from the paper form.</p>
        </div>
        <div className="certificate-actions">
          <button className={mode === "manual" ? "mode-chip active" : "mode-chip"} disabled={voiceMode} onClick={() => onChooseMode("manual")}>Manual fill</button>
          <button className={mode === "voice" ? "mode-chip active" : "mode-chip"} onClick={() => onChooseMode("voice")}>Voice assistant</button>
        </div>
      </div>

      <div className="certificate-layout">
        <div className="certificate-paper">
          <div className="paper-heading"><span>FORM NO. 3</span><strong>APPLICATION FOR ISSUE OF INCOME CERTIFICATE</strong><small>See Rule 4 (1)</small></div>
          <div className="paper-section-title">1. Personal Details</div>
          <div className="certificate-grid">{personalFields.map(renderField)}</div>
          <div className="paper-section-title">2. Address Details</div>
          <div className="certificate-grid">{addressFields.map(renderField)}</div>
          <label className="same-address-toggle"><input type="checkbox" checked={sameAddress} disabled={voiceMode} onChange={(event) => setSameAddress(event.target.checked)} /> Present address is same as permanent address</label>
          <div className="certificate-grid">{locationFields.map(renderField)}</div>
          <div className="paper-section-title">3. Annual Income Details</div>
          <div className="certificate-grid">{incomeFields.map(renderField)}</div>
          <div className="paper-section-title">4. Purpose & Declaration</div>
          <div className="certificate-grid">{declarationFields.map(renderField)}</div>
          <div className="paper-note">Fields marked <b>*</b> are required. Review all information before submission.</div>
        </div>

        <aside className={voiceMode ? "voice-panel active" : "voice-panel"}>
          {mode === null && (
            <div className="mode-choice">
              <div className="choice-orb">V</div>
              <div className="eyebrow">YOUR CHOICE</div>
              <h2>How would you like to fill this form?</h2>
              <p>Enter the details yourself, or let VisionAI ask each question and fill the form as you speak.</p>
              <button className="choice-button primary" onClick={() => onChooseMode("manual")}>⌨ <span><b>Fill manually</b><small>Type directly into the form</small></span></button>
              <button className="choice-button" onClick={() => onChooseMode("voice")}>◉ <span><b>Use voice assistant</b><small>Speak one answer at a time</small></span></button>
            </div>
          )}
          {mode === "manual" && (
            <div className="helper-card">
              <span className="helper-pulse">AI</span>
              <div><div className="eyebrow">NEED HELP?</div><h2>VisionAI is here</h2><p>Ask about any field or switch to voice-assisted filling.</p></div>
              <button onClick={onOpenHelp}>Open AI helper</button>
            </div>
          )}
          {voiceMode && (
            <div className="voice-workspace">
              <div className="voice-workspace-label"><span /> VOICE ASSISTANT ACTIVE</div>
              <h2>{listening ? "I am listening..." : currentField ? `Please tell your ${currentField.id === "fullName" ? "name" : currentField.label.toLowerCase()}` : "All fields captured"}</h2>
              <p>Answer naturally in English or Tamil. I will repeat what I heard and place it in the form.</p>
              <button className={listening ? "speak-button listening" : "speak-button"} onClick={listening ? () => recognition.current?.stop() : startListening}>{listening ? "◌" : "◉"}</button>
              <strong>{listening ? "Listening for your answer" : voiceSupported ? "Listening will start automatically" : "Voice input is unavailable in this browser"}</strong>
              {lastSpelling && <div className="spelling-confirmation"><small>I heard</small><b>{lastSpelling}</b></div>}
              {busy && <small className="voice-status">Checking your answer...</small>}
              {error && <small className="voice-status error">{error}</small>}
              <div className="voice-transcript">{messages.slice(-3).map((message, index) => <p key={`${message.role}-${index}`}><b>{message.role === "assistant" ? "AI" : "You"}</b>{message.text}</p>)}</div>
              {statusMessage && <div className="voice-live-status" role="status">{statusMessage}</div>}
            </div>
          )}
        </aside>
      </div>

      <div className="certificate-footer"><span>{completedCount} of {requiredCount} required fields completed</span><div className="certificate-progress"><i style={{ width: `${(completedCount / requiredCount) * 100}%` }} /></div><button onClick={validateForSubmit}>Review application →</button></div>
    </section>
  );
}
