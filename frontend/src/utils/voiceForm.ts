import type { FormField } from "../hooks/useFormFlow";

export const TAMIL_NADU_CITIES = [
  "Chennai",
  "Madurai",
  "Coimbatore",
  "Tiruchirappalli",
  "Salem",
  "Tirunelveli",
  "Erode",
  "Vellore",
  "Thoothukudi",
  "Thanjavur",
];

export interface ExtractedFields {
  [fieldId: string]: string;
}

export interface FieldErrorMap {
  [fieldId: string]: string;
}

export function isNextCommand(transcript: string) {
  return /^(next|next field|continue|go next|what next|what is next|ask me|ask the next question)[.!? ]*$/i.test(transcript.trim());
}

export function isRepeatCommand(transcript: string) {
  return /^(repeat|say that again|please repeat|i didn't hear|what did you ask)[.!? ]*$/i.test(transcript.trim());
}

export function isExitVoiceCommand(transcript: string) {
  return /\b(exit|leave|stop|end|quit)\b.*\b(voice|assistant|voice assistant|mode)\b|\b(exit|leave|stop|end|quit)\s+(voice|assistant)\b/i.test(transcript.trim());
}

const numberWords: Record<string, string> = {
  zero: "0", oh: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
};

function spokenDigits(value: string) {
  return value
    .toLowerCase()
    .replace(/[-,]/g, " ")
    .split(/\s+/)
    .map((part) => numberWords[part] ?? part)
    .join("")
    .replace(/\D/g, "");
}

function valueAfter(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[.!?]+$/, "");
  }
  return "";
}

export function normalizeEmail(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(at|at the rate)\b/g, "@")
    .replace(/\b(dot|period)\b/g, ".")
    .replace(/\b(underscore|under score)\b/g, "_")
    .replace(/\b(hyphen|dash)\b/g, "-")
    .replace(/\s+/g, "")
    .replace(/,+/g, "");
}

export function extractFields(transcript: string, currentFieldId?: string): ExtractedFields {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const fields: ExtractedFields = {};

  const emailSpeech = valueAfter(text, [
    /(?:my\s+)?e[-\s]?mail\s+(?:address\s+)?(?:is|as|:)?\s+(.+)/i,
  ]);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    (emailSpeech && /\b(?:at|dot|period)\b/i.test(emailSpeech) ? normalizeEmail(emailSpeech) : "");
  if (email) fields.email = email;

  const mobilePhrase = valueAfter(text, [
    /(?:my\s+)?(?:mobile|phone|telephone|contact)\s*(?:number|no)?\s*(?:is|as|:)?\s*(.+)$/i,
  ]);
  const mobileDigits = spokenDigits(mobilePhrase || text.match(/(?:^|\s)(\d[\d\s-]{6,})/)?.[1] || "");
  if (mobileDigits && (/(mobile|phone|telephone|contact)/i.test(lower) || /^\d/.test(text))) fields.mobile = mobileDigits;

  const name = valueAfter(text, [
    /(?:my\s+)?full\s+name\s+(?:is|as)\s+(.+)/i,
    /(?:my\s+)?name\s+(?:is|as|:)?\s*(.+)/i,
    /i\s+am\s+([a-z][a-z\s'-]+)/i,
    /(?:change|update|correct|actually)\s+(?:my\s+)?name\s+(?:to|as|is)\s+(.+)/i,
  ]);
  const cleanName = name?.split(/,|\b(?:and|i am|i'm|i live|my gender)\b/i)[0].trim();
  if (cleanName && !/(female|male|woman|man|gender)/i.test(cleanName)) fields.fullName = cleanName;

  if (/\b(female|woman|girl|lady)\b/i.test(lower)) fields.gender = "Female";
  else if (/\b(male|man|boy)\b/i.test(lower)) fields.gender = "Male";
  else if (/\b(transgender)\b/i.test(lower)) fields.gender = "Transgender";
  else if (/\b(prefer not to say|do not want to specify|don't want to specify)\b/i.test(lower)) fields.gender = "Prefer not to say";

  if (/\btamil\s*nadu\b/i.test(lower)) fields.state = "Tamil Nadu";

  const city = TAMIL_NADU_CITIES.find((item) => new RegExp(`\\b${item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
  if (city) {
    fields.city = city;
    fields.state = "Tamil Nadu";
  }

  const dob = valueAfter(text, [
    /(?:date\s+of\s+birth|dob)\s+(?:is|as|:)?\s+(.+)/i,
  ]);
  if (dob) fields.dateOfBirth = dob;

  if (currentFieldId && Object.keys(fields).length === 0) {
    fields[currentFieldId] = text;
  }

  return fields;
}

export function normalizeFieldValue(fieldId: string, value: string): string {
  const trimmed = value.trim();
  if (fieldId === "email") return normalizeEmail(trimmed);
  if (fieldId === "gender") {
    if (/female|woman|girl|lady/i.test(trimmed)) return "Female";
    if (/male|man|boy/i.test(trimmed)) return "Male";
    if (/transgender/i.test(trimmed)) return "Transgender";
    if (/prefer|don't|do not/i.test(trimmed)) return "Prefer not to say";
  }
  if (fieldId === "maritalStatus") {
    if (/single|unmarried/i.test(trimmed)) return "Single";
    if (/married/i.test(trimmed)) return "Married";
    if (/widow/i.test(trimmed)) return "Widowed";
    if (/divorc/i.test(trimmed)) return "Divorced";
  }
  if (fieldId === "state" && /tamil\s*nadu/i.test(trimmed)) return "Tamil Nadu";
  const city = TAMIL_NADU_CITIES.find((item) => item.toLowerCase() === trimmed.toLowerCase());
  if (fieldId === "city" && city) return city;
  return trimmed;
}

export function validateField(fieldId: string, value: string, fields: FormField[]): string {
  const trimmed = value.trim();
  if (!trimmed) return "This field is required.";
  if (fieldId === "fullName" && !/^[\p{L}][\p{L}\s.'-]*$/u.test(trimmed)) return "Please say a name using letters only.";
  if (fieldId === "mobile" && !/^\d{10}$/.test(trimmed)) return "Your mobile number must contain exactly 10 digits. Please say it again.";
  if (fieldId === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Please provide a valid email address, such as vinu@gmail.com.";
  if (fieldId === "gender" && !["Male", "Female", "Transgender", "Prefer not to say"].includes(trimmed)) return "Please choose male, female, transgender, or prefer not to say.";
  if (fieldId === "state" && trimmed !== "Tamil Nadu") return "For now, only Tamil Nadu is available.";
  if (fieldId === "city" && !TAMIL_NADU_CITIES.includes(trimmed)) return `I couldn't find ${trimmed} under Tamil Nadu. Please say another city.`;
  if (fieldId === "dateOfBirth") {
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime()) || date > new Date()) return "Please provide a valid date of birth.";
  }
  return "";
}

export function validateAll(fields: FormField[]): FieldErrorMap {
  return fields.reduce<FieldErrorMap>((errors, field) => {
    if (field.required || field.value.trim()) {
      const error = validateField(field.id, field.value, fields);
      if (error) errors[field.id] = error;
    }
    return errors;
  }, {});
}

export function responseForField(fieldId: string, value: string, changed: boolean) {
  const labels: Record<string, string> = {
    fullName: "name", mobile: "mobile number", email: "email", gender: "gender",
    state: "state", city: "city", dateOfBirth: "date of birth",
  };
  return `I've ${changed ? "changed" : "entered"} your ${labels[fieldId] ?? fieldId} as ${value}.`;
}

export function spokenValue(fieldId: string, value: string) {
  if (fieldId === "email") {
    return value.replace(/@/g, " at ").replace(/\./g, " dot ").split("").join(" ");
  }
  if (/\d/.test(value)) return value.split("").join(" ");
  return value.toUpperCase().split("").join(" ");
}
