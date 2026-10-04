import { useEffect, useRef, useState } from "react";
import { FormField, useFormFlow } from "../hooks/useFormFlow";
import { extractFields, isExitVoiceCommand, isNextCommand, isRepeatCommand, normalizeFieldValue, spokenValue, TAMIL_NADU_CITIES } from "../utils/voiceForm";

interface IncomeCertificatePageProps {
  mode: "manual" | "voice" | null;
  onChooseMode: (mode: "manual" | "voice" | null) => void;
  onOpenHelp: () => void;
  onStartNew?: () => void;
  resumeApplicationId?: number | null;
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

export default function IncomeCertificatePage({ mode, onChooseMode, onOpenHelp, onStartNew, resumeApplicationId = null }: IncomeCertificatePageProps) {
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
  const spellingActiveRef = useRef(false);
  const lastPromptedFieldRef = useRef<string | null>(null);
  const awaitingRecognitionResultRef = useRef(false);
  const { fields, currentField, completedCount, formComplete, updateField, applyVoiceInput, messages, busy, error, fieldErrors, highlightedField, statusMessage, validateForSubmit, focusNextMissing, resetForm } = useFormFlow("income_certificate", language, voiceMode, resumeApplicationId);
  const currentFieldRef = useRef<FormField | undefined>(currentField);
  const requiredCount = fields.filter((field) => field.required).length;

  useEffect(() => {
    currentFieldRef.current = currentField;
  }, [currentField]);

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
    const fieldId = currentFieldRef.current?.id;
    if (fieldId) {
      lastPromptedFieldRef.current = fieldId;
    }
    const generation = ++promptGeneration.current;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = language === "ta" ? "ta-IN" : "en-IN";
    utterance.onend = () => {
      if (generation === promptGeneration.current && voiceModeRef.current) startListening();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const getVoiceOptions = (fieldId: string): string => {
    if (fieldId === "gender") {
      return " The options are Male, Female, Transgender, or Prefer not to say.";
    }
    if (fieldId === "state") {
      return " The only available option is Tamil Nadu.";
    }
    if (fieldId === "maritalStatus") {
      return " The options are Single, Married, Widowed, or Divorced.";
    }
    return "";
  };

  useEffect(() => {
    if (!voiceMode || !currentField || !window.speechSynthesis) return;
    if (spellingActiveRef.current) return;
    if (lastPromptedFieldRef.current === currentField.id) {
      return;
    }
    const spokenLabel = currentField.id === "fullName" ? "name" : currentField.label.toLowerCase();
    const options = getVoiceOptions(currentField.id);
    speakPromptAndListen(language === "ta" ? `தயவுசெய்து உங்கள் ${currentField.label} கூறவும்` : `Please tell your ${spokenLabel}.${options}`);
  }, [currentField?.id, language, voiceMode]);

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const activeField = currentFieldRef.current;
    if (!Recognition || !activeField || !voiceModeRef.current || listeningRef.current) return;
    const instance = new Recognition();
    awaitingRecognitionResultRef.current = false;
    instance.lang = language === "ta" ? "ta-IN" : "en-IN";
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (event) => {
      const value = event.results[0]?.[0]?.transcript.trim() || "";
      if (!value) return;
      const answeredField = currentFieldRef.current;
      if (!answeredField) return;
      awaitingRecognitionResultRef.current = true;
      if (isExitVoiceCommand(value)) {
        onChooseMode("manual");
        return;
      }
      if (isNextCommand(value) || isRepeatCommand(value)) {
        const label = currentField?.id === "fullName" ? "name" : currentField?.label.toLowerCase();
        awaitingRecognitionResultRef.current = false;
        speakPromptAndListen(`Please tell your ${label || "answer"}.`);
        return;
      }
      spellingActiveRef.current = true;
      void applyVoiceInput(value).then((result) => {
        if (!result.accepted) {
          spellingActiveRef.current = false;
          awaitingRecognitionResultRef.current = false;
          window.setTimeout(() => {
            const failedField = currentFieldRef.current;
            if (voiceModeRef.current && failedField) {
              lastPromptedFieldRef.current = null;
              speakPromptAndListen(
                `${result.message || "That answer was not valid."} Please try your ${failedField.label.toLowerCase()} again.`
              );
            }
          }, 400);
          return;
        }
        const extracted = extractFields(value, answeredField.id);
        const capturedId =
          answeredField.id &&
          extracted[answeredField.id] !== undefined
            ? answeredField.id
            : Object.keys(extracted)[0] || answeredField.id;
        const extractedValue = normalizeFieldValue(
          capturedId,
          extracted[capturedId] ?? value
        );
        const spelling = spokenValue(capturedId, extractedValue);
        let advanced = false;
        const advance = () => {
          if (advanced) return;
          advanced = true;
          spellingActiveRef.current = false;
          const nextFieldId = result.nextField;
          const nextField = fields.find((field) => field.id === nextFieldId);
          const nextLabel = result.nextFieldLabel || nextField?.label;
          if (voiceModeRef.current && nextField) {
              currentFieldRef.current = nextField;
              speakPromptAndListen(
              language === "ta"
                ? `தயவுசெய்து உங்கள் ${nextField.label} கூறவும்`
                : `Please tell your ${
                    nextField.id === "fullName"
                      ? "name"
                      : nextField.label.toLowerCase()
                  }.${getVoiceOptions(nextField.id)}`
            );
          } else if (voiceModeRef.current && nextFieldId && nextLabel) {
            currentFieldRef.current = {
              id: nextFieldId,
              label: nextLabel,
              value: "",
              required: true,
            };
            speakPromptAndListen(
              `Please tell your ${
                nextFieldId === "fullName"
                  ? "name"
                  : nextLabel.toLowerCase()
              }.${getVoiceOptions(nextFieldId)}`
            );
          }
          awaitingRecognitionResultRef.current = false;
        };
        if (!window.speechSynthesis) {
          advance();
          return;
        }
        window.speechSynthesis.cancel();
        const spellingUtterance = new SpeechSynthesisUtterance(spelling);
        spellingUtterance.lang = language === "ta" ? "ta-IN" : "en-IN";
        spellingUtterance.rate = 0.72;
        spellingUtterance.onend = advance;
        window.speechSynthesis.speak(spellingUtterance);
        window.setTimeout(advance, 6000);
      });
    };
    instance.onerror = () => {
      listeningRef.current = false;
      setListening(false);
      if (voiceModeRef.current && !awaitingRecognitionResultRef.current) {
        window.setTimeout(() => startListening(), 700);
      }
    };
    instance.onend = () => {
      listeningRef.current = false;
      setListening(false);
      if (
        voiceModeRef.current &&
        !awaitingRecognitionResultRef.current &&
        !spellingActiveRef.current
      ) {
        window.setTimeout(() => startListening(), 700);
      }
    };
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
        <button
          className="secondary-cta"
          onClick={() => {
            setShowSuccess(false);
            onStartNew?.();
            onChooseMode(null);
            resetForm();
          }}
        >
          Start a new application
        </button>
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
