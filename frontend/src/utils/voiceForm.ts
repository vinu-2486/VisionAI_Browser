
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

export const PURPOSE_OPTIONS = [
  "Education",
  "Scholarship",
  "Government Benefit",
] as const;

export interface ExtractedFields {
  [fieldId: string]: string;
}

export interface FieldErrorMap {
  [fieldId: string]: string;
}

/* -------------------------------------------------------------------------- */
/* Voice commands                                                             */
/* -------------------------------------------------------------------------- */

export function isNextCommand(transcript: string) {
  return /^(next|next field|continue|go next|what next|what is next|ask me|ask the next question)[.!? ]*$/i.test(
    transcript.trim()
  );
}

export function isRepeatCommand(transcript: string) {
  return /^(repeat|say that again|please repeat|i didn't hear|what did you ask)[.!? ]*$/i.test(
    transcript.trim()
  );
}

export function isExitVoiceCommand(transcript: string) {
  return /\b(exit|leave|stop|end|quit)\b.*\b(voice|assistant|voice assistant|mode)\b|\b(exit|leave|stop|end|quit)\s+(voice|assistant)\b/i.test(
    transcript.trim()
  );
}

/* -------------------------------------------------------------------------- */
/* Spoken numbers                                                             */
/* -------------------------------------------------------------------------- */

const numberWords: Record<string, string> = {
  zero: "0",
  oh: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

function spokenDigits(value: string): string {
  const numberWords: Record<string, string> = {
    zero: "0",
    oh: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
  };

  const text = value
    .toLowerCase()
    .trim()
    .replace(/[-,]/g, " ");

  // If speech recognition already returned digits,
  // keep them.
  const existingDigits = text.replace(/\D/g, "");

  if (existingDigits.length > 0) {
    return existingDigits;
  }

  // Convert spoken individual digits:
  // "six zero zero zero four four" -> "600044"
  return text
    .split(/\s+/)
    .map((word) => numberWords[word] ?? "")
    .join("");
}
/* -------------------------------------------------------------------------- */
/* Date of birth                                                              */
/* -------------------------------------------------------------------------- */

/*
 * HTML <input type="date"> requires:
 *
 * YYYY-MM-DD
 *
 * Examples accepted:
 *
 * 26-5-2007
 * 26/5/2007
 * 26.5.2007
 * 26 Feb 2007
 * 26 February 2007
 * 2007-05-26
 */

export function normalizeDateOfBirth(value: string): string {
  const text = value
    .trim()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ");

  // Already in HTML date format
  let match = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    return toIsoDate(day, month, year) || value.trim();
  }

  // 26-5-2007
  // 26/5/2007
  // 26.5.2007
  match = text.match(
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    return toIsoDate(day, month, year) || value.trim();
  }

  // 26 February 2007
  // 26 Feb 2007
  match = text.match(
    /^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})$/i
  );

  if (match) {
    const months: Record<string, number> = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,

      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      sept: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    };

    const day = Number(match[1]);
    const month = months[match[2].toLowerCase()];
    const year = Number(match[3]);

    if (month) {
      return toIsoDate(day, month, year) || value.trim();
    }
  }

  return value.trim();
}

function toIsoDate(
  day: number,
  month: number,
  year: number
): string {
  const date = new Date(
    year,
    month - 1,
    day
  );

  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!valid) {
    return "";
  }

  return `${year}-${String(month).padStart(
    2,
    "0"
  )}-${String(day).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* Email                                                                      */
/* -------------------------------------------------------------------------- */

export function normalizeEmail(value: string) {
  return value
    .toLowerCase()
    .replace(
      /\b(?:at the rate|at)\b/g,
      "@"
    )
    .replace(
      /\b(?:dot|period)\b/g,
      "."
    )
    .replace(
      /\b(?:underscore|under score)\b/g,
      "_"
    )
    .replace(
      /\b(?:hyphen|dash)\b/g,
      "-"
    )
    .replace(/\s+/g, "")
    .replace(/,+/g, "");
}

/* -------------------------------------------------------------------------- */
/* Answer extraction                                                          */
/* -------------------------------------------------------------------------- */

const OWNER = String.raw`(?:(?:my|the)\s+)?`;

const CONNECTOR = String.raw`(?:['’]s\s+|\s+(?:is|are|as|to)\s+|\s*[:=]\s*)`;

const FIELD_LABELS: Array<
  [fieldId: string, phrase: string]
> = [
  [
    "fatherName",
    String.raw`father(?:['’]?s)?\s+(?:full\s+)?name`,
  ],
  [
    "motherName",
    String.raw`mother(?:['’]?s)?\s+(?:full\s+)?name`,
  ],
  [
    "declarationName",
    String.raw`declaration\s+name`,
  ],
  [
    "permanentAddress",
    String.raw`permanent\s+address`,
  ],
  [
    "presentAddress",
    String.raw`(?:present|current|correspondence|communication)\s+address`,
  ],
  [
    "dateOfBirth",
    String.raw`(?:date\s+of\s+birth|d\.?o\.?b\.?|birth\s?date|birthday)`,
  ],
  [
    "mobile",
    String.raw`(?:mobile|phone|telephone|contact|cell)(?:\s+(?:number|no\.?))?`,
  ],
  [
    "email",
    String.raw`e[-\s]?mail(?:\s+(?:address|id))?`,
  ],
  [
    "aadhaar",
    String.raw`a+dh?a+r(?:\s+(?:card|number|no\.?))*`,
  ],
  [
    "pin",
    String.raw`(?:pin\s?code|pin|postal\s+code|zip\s?code)`,
  ],
  [
    "policeStation",
    String.raw`police\s+station`,
  ],
  [
    "postOffice",
    String.raw`post\s+office`,
  ],
  [
    "district",
    String.raw`district`,
  ],
  [
    "maritalStatus",
    String.raw`marital\s+status`,
  ],
  [
    "religion",
    String.raw`religion`,
  ],
  [
    "gender",
    String.raw`gender`,
  ],
  [
    "age",
    String.raw`age`,
  ],
  [
    "state",
    String.raw`state`,
  ],
  [
    "city",
    String.raw`(?:(?:present|current|home)\s+)?(?:city|town)`,
  ],
  [
    "purpose",
    String.raw`purpose`,
  ],
  [
    "fullName",
    String.raw`(?:(?:full|applicant(?:['’]s)?)\s+)?name`,
  ],
];

const LABEL_REGEXES = FIELD_LABELS.map(
  ([fieldId, phrase]) =>
    [
      fieldId,
      new RegExp(
        String.raw`\b${OWNER}(?:${phrase})${CONNECTOR}`,
        "gi"
      ),
    ] as const
);

const START_FILLER =
  /^(?:(?:hi|hello|hey|okay|ok|well|so|um|uh|actually|no|sorry|please|yes|yeah|change|update|correct|set|make)\b[\s,.-]*)+/i;

const FILLER_LEAD =
  /^(?:(?:okay|ok|well|so|um|uh|yes|yeah|actually)\b[\s,.-]*)+/i;

const IT_IS_LEAD =
  /^(?:it\s+is|it['’]s|its|that\s+is|that['’]s)\s+/i;

function tidy(value: string) {
  return value
    .replace(/[\s,.;!?]+$/, "")
    .replace(
      /\s+(?:and|also|then|but)$/i,
      ""
    )
    .replace(/^[\s,.:;-]+/, "")
    .replace(/[\s,.;!?]+$/, "");
}

function splitLabelled(
  text: string
): Array<[string, string]> {
  const body = text.replace(
    START_FILLER,
    ""
  );

  const hits: Array<{
    fieldId: string;
    start: number;
    end: number;
  }> = [];

  for (const [
    fieldId,
    regex,
  ] of LABEL_REGEXES) {
    for (const match of body.matchAll(regex)) {
      const start = match.index ?? 0;
      const end =
        start + match[0].length;

      if (
        hits.some(
          (hit) =>
            start < hit.end &&
            end > hit.start
        )
      ) {
        continue;
      }

      hits.push({
        fieldId,
        start,
        end,
      });
    }
  }

  hits.sort(
    (a, b) => a.start - b.start
  );

  if (
    !hits.length ||
    hits[0].start !== 0
  ) {
    return [];
  }

  return hits.map(
    (hit, index) => [
      hit.fieldId,
      body.slice(
        hit.end,
        hits[index + 1]
          ?.start ?? body.length
      ),
    ]
  );
}

/* -------------------------------------------------------------------------- */
/* Names                                                                      */
/* -------------------------------------------------------------------------- */

const NAME_LEADS = [
  /^(?:(?:my|the)\s+)?(?:(?:full|applicant(?:['’]s)?)\s+)?name(?:['’]s\s+|\s+(?:is|as)\s+|\s*:\s*)/i,

  /^my\s+(?:full\s+)?name\s+/i,

  /^(?:this\s+is|it\s+is|it['’]s|i\s+am|i['’]m|myself|call\s+me|they\s+call\s+me|you\s+can\s+call\s+me)\s+/i,
];

function cleanName(
  value: string
) {
  let name = tidy(value);

  for (const lead of NAME_LEADS) {
    name = name.replace(
      lead,
      ""
    );
  }

  name = name
    .replace(
      /\s+(?:is\s+)?my\s+(?:full\s+)?name\b.*$/i,
      ""
    )
    .split(
      /\s*[,;]\s*|\s+(?:and|but|also)\s+|\s+(?:i\s+am|i['’]m|i\s+live|i\s+stay|my\s+(?:gender|mobile|phone|email|age|father|mother|address))\b/i
    )[0];

  name = tidy(name).replace(
    /\s+(?:please|thanks|thank\s+you|sir|madam)$/i,
    ""
  );

  if (
    !name ||
    /^(?:from|in|at|a|an|the|not|no)\b/i.test(
      name
    )
  ) {
    return "";
  }

  if (
    /^(?:male|female|man|woman|boy|girl|transgender)$/i.test(
      name
    )
  ) {
    return "";
  }

  return name ===
    name.toLowerCase()
    ? name.replace(
        /\b\p{L}/gu,
        (letter) =>
          letter.toUpperCase()
      )
    : name;
}

/* -------------------------------------------------------------------------- */
/* Mobile                                                                     */
/* -------------------------------------------------------------------------- */

function cleanMobile(
  value: string
) {
  const digits =
    spokenDigits(value);

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return digits.slice(2);
  }

  if (
    digits.length === 11 &&
    digits.startsWith("0")
  ) {
    return digits.slice(1);
  }

  return digits;
}

/* -------------------------------------------------------------------------- */
/* Email                                                                      */
/* -------------------------------------------------------------------------- */

function cleanEmail(
  value: string
) {
  const written =
    value.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    )?.[0];

  if (written) {
    return written;
  }

  return /\b(?:at|dot|period)\b/i.test(
    value
  )
    ? normalizeEmail(value)
    : value;
}

/* -------------------------------------------------------------------------- */
/* Gender                                                                     */
/* -------------------------------------------------------------------------- */

function detectGender(
  value: string
) {
  if (
    /\btransgender\b/i.test(value)
  ) {
    return "Transgender";
  }

  if (
    /\b(?:female|woman|girl|lady)\b/i.test(
      value
    )
  ) {
    return "Female";
  }

  if (
    /\b(?:male|man|boy)\b/i.test(
      value
    )
  ) {
    return "Male";
  }

  if (
    /\b(?:prefer not to say|do not want to specify|don't want to specify)\b/i.test(
      value
    )
  ) {
    return "Prefer not to say";
  }

  return "";
}

/* -------------------------------------------------------------------------- */
/* City                                                                       */
/* -------------------------------------------------------------------------- */

function findCity(
  value: string
) {
  return TAMIL_NADU_CITIES.find(
    (city) =>
      new RegExp(
        `\\b${city.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}\\b`,
        "i"
      ).test(value)
  );
}

/* -------------------------------------------------------------------------- */
/* Purpose                                                                    */
/* -------------------------------------------------------------------------- */

function normalizePurpose(
  value: string
) {
  const text = tidy(value)
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (
    /^education(?:al)?$/.test(text)
  ) {
    return "Education";
  }

  if (
    /^scholarship$/.test(text)
  ) {
    return "Scholarship";
  }

  if (
    /^(?:government|govt)\s+(?:benefit|scheme|assistance)$/.test(
      text
    )
  ) {
    return "Government Benefit";
  }

  return tidy(value);
}

/* -------------------------------------------------------------------------- */
/* Field cleaning                                                             */
/* -------------------------------------------------------------------------- */

function cleanForField(
  fieldId: string,
  raw: string
): string {
  const value = tidy(raw)
    .replace(FILLER_LEAD, "")
    .replace(IT_IS_LEAD, "");

  switch (fieldId) {
    case "fullName":
    case "fatherName":
    case "motherName":
    case "declarationName":
      return cleanName(value);

    case "mobile":
      return cleanMobile(value);

    case "aadhaar":
    case "pin":
    case "age":
      return spokenDigits(value);

    case "email":
      return cleanEmail(value);

    case "gender":
      return (
        detectGender(value) ||
        value
      );

    case "state":
      return /\btamil\s*nadu\b/i.test(
        value
      )
        ? "Tamil Nadu"
        : value;

    case "city":
      return (
        findCity(value) ||
        tidy(
          value
            .replace(
              /^(?:(?:my|the)\s+)?(?:city|town)\s*(?:is|as|:)\s*/i,
              ""
            )
            .replace(
              /^(?:i\s+(?:live|stay|reside)\s+in|i['’]?m\s+from|i\s+am\s+from|from|in|at)\s+/i,
              ""
            )
        )
      );

    case "dateOfBirth":
      return normalizeDateOfBirth(
        value
      );

    case "purpose":
      return normalizePurpose(
        value
      );

    case "permanentAddress":
    case "presentAddress":
      return tidy(
        value
          .replace(
            /^(?:(?:my|the)\s+)?(?:(?:permanent|present|current|correspondence)\s+)?address\s*(?:is|as|:)\s*/i,
            ""
          )
          .replace(
            /^i\s+(?:live|stay|reside)\s+(?:in|at)\s+/i,
            ""
          )
      );

    default:
      return value;
  }
}

/* -------------------------------------------------------------------------- */
/* Extract fields                                                             */
/* -------------------------------------------------------------------------- */

export function extractFields(
  transcript: string,
  currentFieldId?: string
): ExtractedFields {
  const text =
    transcript.trim();

  const fields: ExtractedFields =
    {};

  if (!text) {
    return fields;
  }

  // Labelled answers.
  for (const [
    fieldId,
    rawValue,
  ] of splitLabelled(text)) {
    const value =
      cleanForField(
        fieldId,
        rawValue
      );

    if (value) {
      fields[fieldId] =
        value;
    }
  }

  // Plain answer belongs to the
  // field currently being asked.
  if (
    Object.keys(fields)
      .length === 0 &&
    currentFieldId
  ) {
    const value =
      cleanForField(
        currentFieldId,
        text
      );

    if (value) {
      fields[currentFieldId] =
        value;
    }
  }

  // A supported city automatically
  // means Tamil Nadu.
  if (
    fields.city &&
    findCity(fields.city)
  ) {
    fields.state =
      "Tamil Nadu";
  }

  return fields;
}

/* -------------------------------------------------------------------------- */
/* Normalize existing field values                                           */
/* -------------------------------------------------------------------------- */

export function normalizeFieldValue(
  fieldId: string,
  value: string
): string {
  const trimmed =
    value.trim();

  if (fieldId === "email") {
    return normalizeEmail(
      trimmed
    );
  }

  if (
    fieldId === "dateOfBirth"
  ) {
    return normalizeDateOfBirth(
      trimmed
    );
  }

  if (
    [
      "mobile",
      "aadhaar",
      "pin",
      "age",
    ].includes(fieldId)
  ) {
    return spokenDigits(
      trimmed
    );
  }

  if (
    fieldId === "purpose"
  ) {
    return normalizePurpose(
      trimmed
    );
  }

  if (
    fieldId === "gender"
  ) {
    if (
      /female|woman|girl|lady/i.test(
        trimmed
      )
    ) {
      return "Female";
    }

    if (
      /male|man|boy/i.test(
        trimmed
      )
    ) {
      return "Male";
    }

    if (
      /transgender/i.test(
        trimmed
      )
    ) {
      return "Transgender";
    }

    if (
      /prefer|don't|do not/i.test(
        trimmed
      )
    ) {
      return "Prefer not to say";
    }
  }

  if (
    fieldId ===
    "maritalStatus"
  ) {
    if (
      /single|unmarried/i.test(
        trimmed
      )
    ) {
      return "Single";
    }

    if (
      /married/i.test(
        trimmed
      )
    ) {
      return "Married";
    }

    if (
      /widow/i.test(
        trimmed
      )
    ) {
      return "Widowed";
    }

    if (
      /divorc/i.test(
        trimmed
      )
    ) {
      return "Divorced";
    }
  }

  if (
    fieldId === "state" &&
    /tamil\s*nadu/i.test(
      trimmed
    )
  ) {
    return "Tamil Nadu";
  }

  const city =
    TAMIL_NADU_CITIES.find(
      (item) =>
        item.toLowerCase() ===
        trimmed.toLowerCase()
    );

  if (
    fieldId === "city" &&
    city
  ) {
    return city;
  }

  return trimmed;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

const NAME_PATTERN =
  /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u;

function normalizedName(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function hasAtLeastTwoNameParts(
  value: string
) {
  return (
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length >= 2
  );
}

export function validateField(
  fieldId: string,
  value: string,
  fields: FormField[]
): string {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return "This field is required.";
  }

  /* ------------------------------ Names ------------------------------ */

  if (
    [
      "fullName",
      "fatherName",
      "motherName",
      "declarationName",
    ].includes(fieldId)
  ) {
    if (
      !NAME_PATTERN.test(
        trimmed
      ) ||
      !hasAtLeastTwoNameParts(
        trimmed
      )
    ) {
      return "Please provide a valid full name using letters only.";
    }

    // Declaration name must match
    // applicant name.
    if (
      fieldId ===
      "declarationName"
    ) {
      const applicantName =
        fields.find(
          (field) =>
            field.id ===
            "fullName"
        )?.value.trim();

      if (
        applicantName &&
        normalizedName(
          applicantName
        ) !==
          normalizedName(
            trimmed
          )
      ) {
        return "Declaration name must match the applicant name. Please say the same full name again.";
      }
    }
  }

  /* ------------------------------ Mobile ------------------------------ */

  if (
    fieldId === "mobile" &&
    !/^[6-9]\d{9}$/.test(
      trimmed
    )
  ) {
    return "Your mobile number must be a valid 10-digit Indian mobile number. Please say it again.";
  }

  /* ------------------------------ Email ------------------------------ */

  if (
    fieldId === "email" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      trimmed
    )
  ) {
    return "Please provide a valid email address, such as vinu@gmail.com.";
  }

  /* ------------------------------ Aadhaar ----------------------------- */

  if (
    fieldId === "aadhaar" &&
    !/^\d{12}$/.test(
      trimmed
    )
  ) {
    return "Aadhaar number must contain exactly 12 digits. Please say it again.";
  }

  /* ------------------------------ Gender ------------------------------ */

  if (
    fieldId === "gender" &&
    ![
      "Male",
      "Female",
      "Transgender",
      "Prefer not to say",
    ].includes(trimmed)
  ) {
    return "Please choose male, female, transgender, or prefer not to say.";
  }

  /* ------------------------- Marital status --------------------------- */

  if (
    fieldId ===
      "maritalStatus" &&
    ![
      "Single",
      "Married",
      "Widowed",
      "Divorced",
    ].includes(trimmed)
  ) {
    return "Please choose single, married, widowed, or divorced.";
  }

  /* ------------------------------ State ------------------------------- */

  if (
    fieldId === "state" &&
    trimmed !==
      "Tamil Nadu"
  ) {
    return "For now, only Tamil Nadu is available.";
  }

  /* ------------------------------- City ------------------------------- */

  if (
    fieldId === "city" &&
    !TAMIL_NADU_CITIES.includes(
      trimmed
    )
  ) {
    return `I couldn't find ${trimmed} under Tamil Nadu. Please say another supported city.`;
  }

  /* ------------------------------ Purpose ----------------------------- */

  if (
    fieldId === "purpose" &&
    !PURPOSE_OPTIONS.includes(
      trimmed as
        (typeof PURPOSE_OPTIONS)[number]
    )
  ) {
    return "Please choose one of these purposes: Education, Scholarship, or Government Benefit.";
  }

  /* -------------------------------- PIN ------------------------------- */

  if (
    fieldId === "pin" &&
    !/^\d{6}$/.test(
      trimmed
    )
  ) {
    return "PIN code must contain exactly 6 digits. Please say it again.";
  }

  /* ------------------------------ DOB -------------------------------- */

  if (
    fieldId === "dateOfBirth"
  ) {
    const match =
      trimmed.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (!match) {
      return "Please provide your date of birth, for example 26 February 2007.";
    }

    const year =
      Number(match[1]);
    const month =
      Number(match[2]);
    const day =
      Number(match[3]);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    const isValidDate =
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month - 1 &&
      date.getDate() ===
        day;

    if (!isValidDate) {
      return "Please provide a valid date of birth.";
    }

    if (
      date > new Date()
    ) {
      return "Date of birth cannot be in the future.";
    }
  }

  /* ------------------------------ Age -------------------------------- */

  if (
    fieldId === "age" &&
    !/^\d{1,3}$/.test(
      trimmed
    )
  ) {
    return "Please provide a valid age in numbers.";
  }

  return "";
}

/* -------------------------------------------------------------------------- */
/* PIN + city validation                                                      */
/* -------------------------------------------------------------------------- */

/*
 * The PIN itself must first pass the exact six-digit check.
 *
 * Then validatePinForLocation() can be called when the selected
 * state and city are known.
 *
 * We deliberately do not hard-code random PIN numbers here.
 */

const CITY_DISTRICTS: Record<
  string,
  string[]
> = {
  Chennai: [
    "chennai",
  ],

  Madurai: [
    "madurai",
  ],

  Coimbatore: [
    "coimbatore",
  ],

  Tiruchirappalli: [
    "tiruchirappalli",
    "trichy",
  ],

  Salem: [
    "salem",
  ],

  Tirunelveli: [
    "tirunelveli",
  ],

  Erode: [
    "erode",
  ],

  Vellore: [
    "vellore",
  ],

  Thoothukudi: [
    "thoothukudi",
    "tuticorin",
  ],

  Thanjavur: [
    "thanjavur",
    "tanjore",
  ],
};

const pinCache = new Map<
  string,
  {
    state: string;
    district: string;
  }
>();

function normalizeLocationName(
  value: string
) {
  return value
    .toLowerCase()
    .replace(
      /[^a-z]/g,
      ""
    );
}

export async function validatePinForLocation(
  pin: string,
  state: string,
  city: string
): Promise<string> {
  // PIN must contain exactly 6 digits
  if (!/^\d{6}$/.test(pin)) {
    return "PIN code must contain exactly 6 digits. Please say it again.";
  }

  // Currently only Tamil Nadu is supported
  if (state !== "Tamil Nadu") {
    return "Please select Tamil Nadu before validating the PIN code.";
  }

  // City must be one of the supported cities
  const expectedDistricts = CITY_DISTRICTS[city];

  if (!expectedDistricts) {
    return "Please select a supported Tamil Nadu city before giving the PIN code.";
  }

  try {
    let result = pinCache.get(pin);

    if (!result) {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`
      );

      if (!response.ok) {
        return "I couldn't verify that PIN code right now. Please check the PIN code and try again.";
      }

      const data = await response.json();

      // India Post API returns an array
      const postOfficeData = data?.[0];

      if (
        !postOfficeData ||
        postOfficeData.Status !== "Success" ||
        !postOfficeData.PostOffice ||
        postOfficeData.PostOffice.length === 0
      ) {
        return "That PIN code was not found. Please say a valid 6-digit PIN code.";
      }

      const firstPostOffice = postOfficeData.PostOffice[0];

      if (
        !firstPostOffice.State ||
        !firstPostOffice.District
      ) {
        return "I couldn't determine the location for that PIN code. Please try again.";
      }

      result = {
        state: normalizeLocationName(
          firstPostOffice.State
        ),
        district: normalizeLocationName(
          firstPostOffice.District
        ),
      };

      pinCache.set(pin, result);
    }

    // Check state
    if (result.state !== "tamilnadu") {
      return "That PIN code is not in Tamil Nadu. Please give a Tamil Nadu PIN code.";
    }

    // Check city/district
    const districtMatches = expectedDistricts.some(
      (district) => {
        const normalizedDistrict =
          normalizeLocationName(district);

        return (
          result.district === normalizedDistrict ||
          result.district.includes(normalizedDistrict) ||
          normalizedDistrict.includes(result.district)
        );
      }
    );

    if (!districtMatches) {
      return `PIN ${pin} does not match ${city}. Please give a PIN code for ${city}.`;
    }

    return "";
  } catch (error) {
    console.error("PIN validation error:", error);

    return "I couldn't verify the PIN code right now. Please check the PIN code and try again.";
  }
}

/* -------------------------------------------------------------------------- */
/* Validate entire form                                                       */
/* -------------------------------------------------------------------------- */

export function validateAll(
  fields: FormField[]
): FieldErrorMap {
  return fields.reduce<FieldErrorMap>(
    (
      errors,
      field
    ) => {
      /*
       * Aadhaar is mandatory even if the
       * FormField definition accidentally
       * says required: false.
       */
      const mustValidate =
        field.required ||
        field.value.trim() ||
        field.id === "aadhaar";

      if (
        mustValidate
      ) {
        const error =
          validateField(
            field.id,
            field.value,
            fields
          );

        if (error) {
          errors[
            field.id
          ] = error;
        }
      }

      return errors;
    },
    {}
  );
}

/* -------------------------------------------------------------------------- */
/* Voice response                                                             */
/* -------------------------------------------------------------------------- */

export function responseForField(
  fieldId: string,
  value: string,
  changed: boolean
) {
  const labels: Record<
    string,
    string
  > = {
    fullName: "name",
    fatherName:
      "father's name",
    motherName:
      "mother's name",
    declarationName:
      "declaration name",
    mobile:
      "mobile number",
    email: "email",
    gender: "gender",
    state: "state",
    city: "city",
    dateOfBirth:
      "date of birth",
    aadhaar:
      "Aadhaar number",
    pin: "PIN code",
    purpose: "purpose",
    maritalStatus:
      "marital status",
    religion:
      "religion",
    age: "age",
  };

  return `I've ${
    changed
      ? "changed"
      : "entered"
  } your ${
    labels[fieldId] ??
    fieldId
  } as ${value}.`;
}

/* -------------------------------------------------------------------------- */
/* Spoken value                                                               */
/* -------------------------------------------------------------------------- */

export function spokenValue(
  fieldId: string,
  value: string
) {
  if (
    fieldId === "email"
  ) {
    return value
      .replace(
        /@/g,
        " at "
      )
      .replace(
        /\./g,
        " dot "
      )
      .split("")
      .join(" ");
  }

  if (
    fieldId ===
    "dateOfBirth"
  ) {
    const match =
      value.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (match) {
      return `${match[3]} ${match[2]} ${match[1]}`;
    }
  }

  if (
    /\d/.test(value)
  ) {
    return value
      .split("")
      .join(" ");
  }

  return value
    .toUpperCase()
    .split("")
    .join(" ");
}