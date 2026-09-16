import { useCallback, useEffect, useMemo, useState } from "react";
import {
  extractFields,
  FieldErrorMap,
  isNextCommand,
  isRepeatCommand,
  normalizeFieldValue,
  responseForField,
  validateAll,
  validateField,
} from "../utils/voiceForm";

export interface FormField {
  id: string;
  label: string;
  value: string;
  required: boolean;
  hint?: string;
}

export interface ConversationMessage {
  role: "assistant" | "user";
  text: string;
}

const API_URL = "http://localhost:8000/api";

const initialFields: FormField[] = [
  ["fullName", "Name of Applicant", true],
  ["mobile", "Mobile Number", true],
  ["email", "Email", true],
  ["gender", "Gender", true],
  ["state", "State", true],
  ["city", "City", true],
  ["dateOfBirth", "Date of Birth", true],
  ["age", "Age", true],
  ["maritalStatus", "Marital Status", true],
  ["religion", "Religion", true],
  ["fatherName", "Father's Name", true],
  ["motherName", "Mother's Name", true],
  ["aadhaar", "Aadhaar Number", false],
  ["permanentAddress", "Permanent Address", true],
  ["presentAddress", "Present Address", true],
  ["policeStation", "Police Station", true],
  ["postOffice", "Post Office", true],
  ["district", "District", true],
  ["pin", "PIN Code", true],
  ["annualIncomeAgriculture", "Agriculture Income", true],
  ["annualIncomeSalary", "Salary Income", true],
  ["annualIncomeOther", "Other Income", true],
  ["annualIncome", "Total Annual Income", true],
  ["purpose", "Purpose", true],
  ["declarationName", "Declaration Name", true],
].map(([id, label, required]) => ({
  id: id as string,
  label: label as string,
  value: "",
  required: required as boolean,
}));

export function useFormFlow(
  serviceType = "income_certificate",
  language: "en" | "ta" = "en",
  conversationEnabled = true
) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const currentField = conversationEnabled
    ? fields.find((field) => field.required && field.id !== "age" && !field.value.trim()) || fields[currentIndex]
    : fields[currentIndex];

  const setCurrentFromId = (fieldId: string | null) => {
    if (!fieldId) return;
    const nextIndex = fields.findIndex((field) => field.id === fieldId);
    if (nextIndex >= 0) setCurrentIndex(nextIndex);
  };

  const startSession = useCallback(async () => {
    if (!conversationEnabled) {
      setMessages([]);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/conversation/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_type: serviceType, language }),
      });
      if (!response.ok) throw new Error("The assistant service is unavailable.");
      const data = await response.json();
      setSessionId(data.session_id);
      setCurrentFromId(data.current_field);
      setMessages([{ role: "assistant", text: data.assistant_message }]);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start.");
      setMessages([{
        role: "assistant",
        text: language === "ta"
          ? "உங்கள் வருமானச் சான்றிதழ் விண்ணப்பத்தை தொடங்கலாம். உங்கள் முழு பெயர் என்ன?"
          : "We can start your Income Certificate application. What is your full name?",
      }]);
    } finally {
      setBusy(false);
    }
  }, [conversationEnabled, language, serviceType]);

  useEffect(() => {
    if (!conversationEnabled || sessionId) return;
    const firstMissing = fields.findIndex((field) => field.required && !field.value.trim() && field.id !== "age");
    if (firstMissing >= 0) setCurrentIndex(firstMissing);
    void startSession();
  }, [conversationEnabled, fields, sessionId, startSession]);

  const completedCount = useMemo(() => {
    return fields.filter((field) => field.value.trim().length > 0).length;
  }, [fields]);

  const updateField = (id: string, value: string) => {
    setFields((previous) =>
      previous.map((field) => {
        if (field.id === id) return { ...field, value };
        if (id === "dateOfBirth" && field.id === "age") {
          const birthday = new Date(value);
          if (!Number.isNaN(birthday.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - birthday.getFullYear();
            const beforeBirthday = today < new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
            if (beforeBirthday) age -= 1;
            return { ...field, value: age >= 0 ? String(age) : "" };
          }
        }
        return field;
      })
    );
  };

  const focusNextMissing = () => {
    setFields((currentFields) => {
      const nextIndex = currentFields.findIndex(
        (field) => field.required && field.id !== "age" && !field.value.trim()
      );
      if (nextIndex >= 0) setCurrentIndex(nextIndex);
      return currentFields;
    });
  };

  const speakAndDisplay = (message: string) => {
    setStatusMessage(message);
    setMessages((previous) => [...previous, { role: "assistant", text: message }]);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = language === "ta" ? "ta-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const promptForCurrentField = () => {
    if (!currentField) {
      speakAndDisplay("All required fields are complete. You can review the form now.");
      return;
    }
    const label = currentField.id === "fullName" ? "name" : currentField.label.toLowerCase();
    const options = currentField.id === "gender"
      ? " The options are Male, Female, Transgender, or Prefer not to say."
      : currentField.id === "maritalStatus"
        ? " The options are Single, Married, Widowed, or Divorced."
        : currentField.id === "state" ? " The available option is Tamil Nadu."
          : currentField.id === "city" ? " Available Tamil Nadu cities include Chennai, Madurai, Coimbatore, Salem, and Vellore." : "";
    speakAndDisplay(`Please tell your ${label}.${options}`);
  };

  const applyVoiceInput = async (transcript: string) => {
    if (isNextCommand(transcript) || isRepeatCommand(transcript)) {
      promptForCurrentField();
      return true;
    }

    const extracted = extractFields(transcript, currentField?.id);
    const extractedIds = Object.keys(extracted);
    if (!extractedIds.length) {
      speakAndDisplay("I could not identify a form detail. Please say the field and value, such as: My name is Vinu Priya.");
      return false;
    }

    const nextErrors: FieldErrorMap = {};
    const accepted: string[] = [];
    for (const fieldId of extractedIds) {
      const value = normalizeFieldValue(fieldId, extracted[fieldId]);
      const selectedState = extracted.state || fields.find((field) => field.id === "state")?.value;
      const validationError = fieldId === "city" && !selectedState
        ? "Please select Tamil Nadu as your state before choosing a city."
        : validateField(fieldId, value, fields);
      if (validationError) nextErrors[fieldId] = validationError;
      else {
        const existing = fields.find((field) => field.id === fieldId)?.value;
        updateField(fieldId, value);
        accepted.push(responseForField(fieldId, value, Boolean(existing)));
      }
    }

    setFieldErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      const invalidField = Object.keys(nextErrors)[0];
      setHighlightedField(invalidField);
      speakAndDisplay(firstError);
      return false;
    }

    const response = accepted.join(" ");
    setHighlightedField(extractedIds[extractedIds.length - 1]);
    const updatedValues = new Map(fields.map((field) => [field.id, field.value]));
    extractedIds.forEach((fieldId) => updatedValues.set(fieldId, extracted[fieldId]));
    const nextMissingIndex = fields.findIndex(
      (field) => field.required && !updatedValues.get(field.id)?.trim()
    );
    if (nextMissingIndex >= 0) setCurrentIndex(nextMissingIndex);
    speakAndDisplay(response);
    window.setTimeout(() => setHighlightedField(null), 1600);
    return true;
  };

  const validateForSubmit = () => {
    const errors = validateAll(fields);
    setFieldErrors(errors);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      setHighlightedField(firstError);
      speakAndDisplay(errors[firstError]);
      return false;
    }
    speakAndDisplay("All the information looks valid. You can submit the form.");
    return true;
  };

  const sendAnswer = async (value: string): Promise<boolean> => {
    const answer = value.trim();
    if (!answer || busy) return false;
    setBusy(true);
    setError("");
    setMessages((previous) => [...previous, { role: "user", text: answer }]);
    if (currentField && !conversationEnabled) updateField(currentField.id, answer);

    if (!sessionId) {
      if (currentField) updateField(currentField.id, answer);
      nextField();
      setBusy(false);
      return true;
    }

    try {
      const response = await fetch(`${API_URL}/conversation/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: answer }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "The answer could not be processed.");
      const accepted = data.validation_errors.length === 0;
      if (currentField && accepted) updateField(currentField.id, answer);
      setMessages((previous) => [...previous, { role: "assistant", text: data.assistant_message }]);
      setCurrentFromId(data.next_field);
      if (data.completed) setCurrentIndex(fields.length - 1);
      return accepted;
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send answer.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const nextField = () => {
    setCurrentIndex((index) =>
      Math.min(index + 1, fields.length - 1)
    );
  };

  const previousField = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  };

  const resetForm = () => {
    setFields(initialFields);
    setCurrentIndex(0);
  };

  return {
    fields,
    currentField,
    currentIndex,
    completedCount,
    updateField,
    nextField,
    previousField,
    resetForm,
    messages,
    busy,
    error,
    sendAnswer,
    applyVoiceInput,
    fieldErrors,
    highlightedField,
    statusMessage,
    validateForSubmit,
    focusNextMissing,
  };
}