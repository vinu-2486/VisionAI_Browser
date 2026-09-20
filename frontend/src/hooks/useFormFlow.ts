import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  extractFields,
  FieldErrorMap,
  isNextCommand,
  isRepeatCommand,
  normalizeFieldValue,
  responseForField,
  validateAll,
  validateField,
  validatePinForLocation,
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

const API_URL =
  "http://localhost:8000/api";

/* -------------------------------------------------------------------------- */
/* Initial fields                                                             */
/* -------------------------------------------------------------------------- */

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

  // Aadhaar is REQUIRED.
  ["aadhaar", "Aadhaar Number", true],

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

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useFormFlow(
  serviceType = "income_certificate",
  language: "en" | "ta" = "en",
  conversationEnabled = true
) {
  const [fields, setFields] =
    useState<FormField[]>(
      initialFields
    );

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [sessionId, setSessionId] =
    useState<string | null>(null);

  const [messages, setMessages] =
    useState<ConversationMessage[]>(
      []
    );

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState<FieldErrorMap>({});

  const [highlightedField, setHighlightedField] =
    useState<string | null>(null);

  const [statusMessage, setStatusMessage] =
    useState("");

  /* ---------------------------------------------------------------------- */
  /* Current field                                                          */
  /* ---------------------------------------------------------------------- */

  const currentField =
    conversationEnabled
      ? fields.find(
          (field) =>
            field.required &&
            field.id !== "age" &&
            !field.value.trim()
        ) ||
        fields[currentIndex]
      : fields[currentIndex];

  /* ---------------------------------------------------------------------- */
  /* Set current field from ID                                             */
  /* ---------------------------------------------------------------------- */

  const setCurrentFromId = (
    fieldId: string | null
  ) => {
    if (!fieldId) return;

    const nextIndex =
      fields.findIndex(
        (field) =>
          field.id === fieldId
      );

    if (nextIndex >= 0) {
      setCurrentIndex(
        nextIndex
      );
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Start conversation                                                     */
  /* ---------------------------------------------------------------------- */

  const startSession =
    useCallback(async () => {
      if (!conversationEnabled) {
        setMessages([]);
        return;
      }

      setBusy(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/conversation/start`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                service_type:
                  serviceType,
                language,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            "The assistant service is unavailable."
          );
        }

        const data =
          await response.json();

        setSessionId(
          data.session_id
        );

        setCurrentFromId(
          data.current_field
        );

        setMessages([
          {
            role: "assistant",
            text:
              data.assistant_message,
          },
        ]);
      } catch (
        startError
      ) {
        setError(
          startError instanceof
            Error
            ? startError.message
            : "Unable to start."
        );

        setMessages([
          {
            role: "assistant",
            text:
              language === "ta"
                ? "உங்கள் வருமானச் சான்றிதழ் விண்ணப்பத்தை தொடங்கலாம். உங்கள் முழு பெயர் என்ன?"
                : "We can start your Income Certificate application. What is your full name?",
          },
        ]);
      } finally {
        setBusy(false);
      }
    }, [
      conversationEnabled,
      language,
      serviceType,
    ]);

  /* ---------------------------------------------------------------------- */
  /* Start session once                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (
      !conversationEnabled ||
      sessionId
    ) {
      return;
    }

    const firstMissing =
      fields.findIndex(
        (field) =>
          field.required &&
          !field.value.trim() &&
          field.id !== "age"
      );

    if (firstMissing >= 0) {
      setCurrentIndex(
        firstMissing
      );
    }

    void startSession();
  }, [
    conversationEnabled,
    fields,
    sessionId,
    startSession,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Completed count                                                        */
  /* ---------------------------------------------------------------------- */

  const completedCount =
    useMemo(() => {
      return fields.filter(
        (field) =>
          field.value.trim()
            .length > 0
      ).length;
    }, [fields]);

  /* ---------------------------------------------------------------------- */
  /* Update field                                                           */
  /* ---------------------------------------------------------------------- */

  const updateField = (
    id: string,
    value: string
  ) => {
    setFields(
      (previous) =>
        previous.map(
          (field) => {
            if (
              field.id === id
            ) {
              return {
                ...field,
                value,
              };
            }

            /*
             * Automatically calculate age
             * whenever DOB changes.
             */
            if (
              id ===
                "dateOfBirth" &&
              field.id === "age"
            ) {
              const birthday =
                new Date(value);

              if (
                !Number.isNaN(
                  birthday.getTime()
                )
              ) {
                const today =
                  new Date();

                let age =
                  today.getFullYear() -
                  birthday.getFullYear();

                const beforeBirthday =
                  today <
                  new Date(
                    today.getFullYear(),
                    birthday.getMonth(),
                    birthday.getDate()
                  );

                if (
                  beforeBirthday
                ) {
                  age -= 1;
                }

                return {
                  ...field,
                  value:
                    age >= 0
                      ? String(age)
                      : "",
                };
              }
            }

            return field;
          }
        )
    );
  };

  /* ---------------------------------------------------------------------- */
  /* Focus next missing field                                               */
  /* ---------------------------------------------------------------------- */

  const focusNextMissing =
    () => {
      setFields(
        (currentFields) => {
          const nextIndex =
            currentFields.findIndex(
              (field) =>
                field.required &&
                field.id !==
                  "age" &&
                !field.value.trim()
            );

          if (
            nextIndex >= 0
          ) {
            setCurrentIndex(
              nextIndex
            );
          }

          return currentFields;
        }
      );
    };

  /* ---------------------------------------------------------------------- */
  /* Speak + display                                                        */
  /* ---------------------------------------------------------------------- */

  const speakAndDisplay = (
    message: string
  ) => {
    setStatusMessage(
      message
    );

    setMessages(
      (previous) => [
        ...previous,
        {
          role: "assistant",
          text: message,
        },
      ]
    );

    if (
      typeof window !==
        "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          message
        );

      utterance.lang =
        language === "ta"
          ? "ta-IN"
          : "en-IN";

      window.speechSynthesis.speak(
        utterance
      );
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Prompt current field                                                   */
  /* ---------------------------------------------------------------------- */

  const promptForCurrentField =
    () => {
      if (!currentField) {
        speakAndDisplay(
          "All required fields are complete. You can review the form now."
        );
        return;
      }

      const label =
        currentField.id ===
        "fullName"
          ? "name"
          : currentField.label.toLowerCase();

      let options = "";

      if (
        currentField.id ===
        "gender"
      ) {
        options =
          " The options are Male, Female, Transgender, or Prefer not to say.";
      } else if (
        currentField.id ===
        "maritalStatus"
      ) {
        options =
          " The options are Single, Married, Widowed, or Divorced.";
      } else if (
        currentField.id ===
        "state"
      ) {
        options =
          " The available option is Tamil Nadu.";
      } else if (
        currentField.id ===
        "city"
      ) {
        options =
          " Available Tamil Nadu cities include Chennai, Madurai, Coimbatore, Tiruchirappalli, Salem, Tirunelveli, Erode, Vellore, Thoothukudi, and Thanjavur.";
      } else if (
        currentField.id ===
        "purpose"
      ) {
        options =
          " The available options are Education, Scholarship, or Government Benefit.";
      } else if (
        currentField.id ===
        "aadhaar"
      ) {
        options =
          " Please say exactly 12 digits.";
      } else if (
        currentField.id === "pin"
      ) {
        options =
          " Please say exactly 6 digits for the selected city.";
      } else if (
        currentField.id ===
        "dateOfBirth"
      ) {
        options =
          " You can say your date of birth like 26 February 2007.";
      } else if (
        currentField.id ===
        "declarationName"
      ) {
        options =
          " Please say the same full name as the applicant name.";
      }

      speakAndDisplay(
        `Please tell your ${label}.${options}`
      );
    };

  /* ---------------------------------------------------------------------- */
  /* Validate one field before accepting it                                 */
  /* ---------------------------------------------------------------------- */

  const validateAnswerForField =
    async (
      fieldId: string,
      value: string
    ): Promise<string> => {
      const normalizedValue =
        normalizeFieldValue(
          fieldId,
          value
        );

      /*
       * Create the most recent version
       * of the fields for validation.
       */
      const validationFields =
        fields.map(
          (field) =>
            field.id ===
            fieldId
              ? {
                  ...field,
                  value:
                    normalizedValue,
                }
              : field
        );

      const localError =
        validateField(
          fieldId,
          normalizedValue,
          validationFields
        );

      if (localError) {
        return localError;
      }

      /* -------------------------------------------------------------- */
      /* PIN must match selected state + city                            */
      /* -------------------------------------------------------------- */

      if (
        fieldId === "pin"
      ) {
        const state =
          validationFields.find(
            (field) =>
              field.id ===
              "state"
          )?.value ||
          "";

        const city =
          validationFields.find(
            (field) =>
              field.id ===
              "city"
          )?.value ||
          "";

        return await validatePinForLocation(
          normalizedValue,
          state,
          city
        );
      }

      return "";
    };

  /* ---------------------------------------------------------------------- */
  /* Apply voice input                                                      */
  /* ---------------------------------------------------------------------- */

  const applyVoiceInput =
    async (
      transcript: string
    ) => {
      if (
        isNextCommand(
          transcript
        ) ||
        isRepeatCommand(
          transcript
        )
      ) {
        /*
         * "Next" does NOT allow the user to
         * skip a required invalid field.
         *
         * Simply repeat the current question.
         */
        promptForCurrentField();
        return true;
      }

      const extracted =
        extractFields(
          transcript,
          currentField?.id
        );

      const extractedIds =
        Object.keys(
          extracted
        );

      if (
        !extractedIds.length
      ) {
        speakAndDisplay(
          "I could not identify a form detail. Please say the field and value, such as: My name is Vinu Priya."
        );

        return false;
      }

      const nextErrors:
        FieldErrorMap = {};

      const accepted: string[] =
        [];

      /*
       * Validate ALL extracted fields first.
       *
       * We do not update anything until every
       * value being submitted is valid.
       */
      const normalizedValues =
        new Map<
          string,
          string
        >();

      for (const fieldId of extractedIds) {
        const value =
          normalizeFieldValue(
            fieldId,
            extracted[fieldId]
          );

        normalizedValues.set(
          fieldId,
          value
        );

        const validationError =
          await validateAnswerForField(
            fieldId,
            value
          );

        if (
          validationError
        ) {
          nextErrors[
            fieldId
          ] =
            validationError;
        }
      }

      /*
       * If even ONE value is invalid:
       *
       * - do not move forward
       * - do not accept the invalid value
       * - highlight the field
       * - ask the same question again
       */
      if (
        Object.keys(
          nextErrors
        ).length > 0
      ) {
        setFieldErrors(
          nextErrors
        );

        const invalidField =
          Object.keys(
            nextErrors
          )[0];

        setHighlightedField(
          invalidField
        );

        speakAndDisplay(
          nextErrors[
            invalidField
          ]
        );

        return false;
      }

      /*
       * Everything is valid.
       * Now update the fields.
       */
      for (const fieldId of extractedIds) {
        const value =
          normalizedValues.get(
            fieldId
          )!;

        const existing =
          fields.find(
            (field) =>
              field.id ===
              fieldId
          )?.value;

        updateField(
          fieldId,
          value
        );

        accepted.push(
          responseForField(
            fieldId,
            value,
            Boolean(existing)
          )
        );
      }

      setFieldErrors({});

      const lastFieldId =
        extractedIds[
          extractedIds.length - 1
        ];

      setHighlightedField(
        lastFieldId
      );

      /*
       * Calculate next field using the
       * values that have just been accepted.
       */
      const updatedValues =
        new Map(
          fields.map(
            (field) => [
              field.id,
              field.value,
            ]
          )
        );

      normalizedValues.forEach(
        (value, fieldId) => {
          updatedValues.set(
            fieldId,
            value
          );
        }
      );

      const nextMissingIndex =
        fields.findIndex(
          (field) =>
            field.required &&
            field.id !==
              "age" &&
            !updatedValues
              .get(
                field.id
              )
              ?.trim()
        );

      if (
        nextMissingIndex >= 0
      ) {
        setCurrentIndex(
          nextMissingIndex
        );
      }

      speakAndDisplay(
        accepted.join(" ")
      );

      window.setTimeout(
        () =>
          setHighlightedField(
            null
          ),
        1600
      );

      return true;
    };

  /* ---------------------------------------------------------------------- */
  /* Validate before submit                                                 */
  /* ---------------------------------------------------------------------- */

  const validateForSubmit =
    () => {
      const errors =
        validateAll(
          fields
        );

      setFieldErrors(
        errors
      );

      const firstError =
        Object.keys(
          errors
        )[0];

      if (
        firstError
      ) {
        setHighlightedField(
          firstError
        );

        speakAndDisplay(
          errors[
            firstError
          ]
        );

        return false;
      }

      speakAndDisplay(
        "All required information is valid. You can submit the form."
      );

      return true;
    };

  /* ---------------------------------------------------------------------- */
  /* Send answer                                                            */
  /* ---------------------------------------------------------------------- */

  const sendAnswer =
    async (
      value: string
    ): Promise<boolean> => {
      const answer =
        value.trim();

      if (
        !answer ||
        busy
      ) {
        return false;
      }

      /*
       * ---------------------------------------------------------------
       * IMPORTANT:
       *
       * Validate the current field BEFORE sending it to the backend.
       *
       * This prevents the backend from moving to the next field
       * after an invalid answer.
       * ---------------------------------------------------------------
       */

      if (currentField) {
        const normalizedAnswer =
          normalizeFieldValue(
            currentField.id,
            answer
          );

        const validationError =
          await validateAnswerForField(
            currentField.id,
            normalizedAnswer
          );

        if (
          validationError
        ) {
          setFieldErrors(
            (previous) => ({
              ...previous,
              [currentField.id]:
                validationError,
            })
          );

          setHighlightedField(
            currentField.id
          );

          speakAndDisplay(
            validationError
          );

          /*
           * VERY IMPORTANT:
           *
           * Do not call the backend.
           * Do not call nextField().
           * Do not change currentIndex.
           *
           * Therefore the user remains on
           * exactly the same field.
           */
          return false;
        }

        /*
         * The answer is locally valid.
         * Store the normalized value.
         */
        updateField(
          currentField.id,
          normalizedAnswer
        );

        setFieldErrors(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[
              currentField.id
            ];

            return next;
          }
        );
      }

      setBusy(true);
      setError("");

      setMessages(
        (previous) => [
          ...previous,
          {
            role: "user",
            text: answer,
          },
        ]
      );

      /*
       * No conversation backend.
       *
       * Since the answer has already been
       * validated above, we can safely move
       * to the next field.
       */
      if (!sessionId) {
        nextField();

        setBusy(false);

        return true;
      }

      try {
        /*
         * Send the normalized answer to the
         * backend when possible.
         */
        const backendAnswer =
          currentField
            ? normalizeFieldValue(
                currentField.id,
                answer
              )
            : answer;

        const response =
          await fetch(
            `${API_URL}/conversation/message`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                session_id:
                  sessionId,
                message:
                  backendAnswer,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "The answer could not be processed."
          );
        }

        /*
         * Backend validation errors.
         */
        const backendErrors =
          data.validation_errors;

        const hasBackendErrors =
          Array.isArray(
            backendErrors
          )
            ? backendErrors.length >
              0
            : backendErrors &&
              Object.keys(
                backendErrors
              ).length > 0;

        if (
          hasBackendErrors
        ) {
          /*
           * The backend rejected the answer.
           *
           * Stay on the SAME FIELD.
           */
          let message =
            "That answer is not valid. Please try again.";

          if (
            Array.isArray(
              backendErrors
            ) &&
            backendErrors.length >
              0
          ) {
            const first =
              backendErrors[0];

            if (
              typeof first ===
              "string"
            ) {
              message =
                first;
            } else if (
              first &&
              typeof first.message ===
                "string"
            ) {
              message =
                first.message;
            }
          }

          setFieldErrors(
            (previous) => ({
              ...previous,
              ...(currentField
                ? {
                    [currentField.id]:
                      message,
                  }
                : {}),
            })
          );

          if (
            currentField
          ) {
            setHighlightedField(
              currentField.id
            );
          }

          speakAndDisplay(
            message
          );

          /*
           * DO NOT:
           *
           * setCurrentFromId(data.next_field)
           *
           * because the answer failed.
           */
          return false;
        }

        /*
         * Backend accepted the answer.
         */
        setFieldErrors(
          {}
        );

        if (
          data.assistant_message
        ) {
          setMessages(
            (previous) => [
              ...previous,
              {
                role: "assistant",
                text:
                  data.assistant_message,
              },
            ]
          );
        }

        /*
         * Only move to the backend's next field
         * AFTER validation succeeded.
         */
        if (
          data.completed
        ) {
          setCurrentIndex(
            fields.length - 1
          );
        } else if (
          data.next_field
        ) {
          setCurrentFromId(
            data.next_field
          );
        } else {
          /*
           * If backend doesn't provide next_field,
           * find the next missing field locally.
           */
          focusNextMissing();
        }

        return true;
      } catch (
        sendError
      ) {
        setError(
          sendError instanceof
            Error
            ? sendError.message
            : "Unable to send answer."
        );

        return false;
      } finally {
        setBusy(false);
      }
    };

  /* ---------------------------------------------------------------------- */
  /* Next field                                                             */
  /* ---------------------------------------------------------------------- */

  const nextField =
    () => {
      setCurrentIndex(
        (index) =>
          Math.min(
            index + 1,
            fields.length - 1
          )
      );
    };

  /* ---------------------------------------------------------------------- */
  /* Previous field                                                         */
  /* ---------------------------------------------------------------------- */

  const previousField =
    () => {
      setCurrentIndex(
        (index) =>
          Math.max(
            index - 1,
            0
          )
      );
    };

  /* ---------------------------------------------------------------------- */
  /* Reset form                                                             */
  /* ---------------------------------------------------------------------- */

  const resetForm =
    () => {
      setFields(
        initialFields
      );

      setCurrentIndex(0);

      setSessionId(null);

      setMessages([]);

      setError("");

      setFieldErrors({});

      setHighlightedField(
        null
      );

      setStatusMessage("");
    };

  /* ---------------------------------------------------------------------- */
  /* Return                                                                 */
  /* ---------------------------------------------------------------------- */

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