import { useMemo, useState } from "react";

export interface FormField {
  id: string;
  label: string;
  value: string;
  required: boolean;
}

const initialFields: FormField[] = [
  {
    id: "name",
    label: "Full Name",
    value: "",
    required: true,
  },
  {
    id: "dob",
    label: "Date of Birth",
    value: "",
    required: true,
  },
  {
    id: "address",
    label: "Address",
    value: "",
    required: true,
  },
  {
    id: "mobile",
    label: "Mobile Number",
    value: "",
    required: true,
  },
];

export function useFormFlow() {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentField = fields[currentIndex];

  const completedCount = useMemo(() => {
    return fields.filter((field) => field.value.trim().length > 0).length;
  }, [fields]);

  const updateField = (id: string, value: string) => {
    setFields((previous) =>
      previous.map((field) =>
        field.id === id ? { ...field, value } : field
      )
    );
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
  };
}