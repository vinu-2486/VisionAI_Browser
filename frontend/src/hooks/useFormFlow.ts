import { useMemo, useState } from 'react';

export type FormEntry = {
  label: string;
  value: string;
};

export type FormFlowState = {
  formTitle: string;
  currentQuestion: string;
  language: string;
  prompt: string;
  entries: FormEntry[];
  suggestions: string[];
  confirmationMessage: string;
};

const initialEntries: FormEntry[] = [
  { label: 'Full name', value: 'Arun Kumar' },
  { label: 'Date of birth', value: '12-08-1999' },
  { label: 'Address', value: 'Chennai, Tamil Nadu' },
  { label: 'Mobile number', value: '+91 98765 43210' },
];

export function useFormFlow(): FormFlowState {
  const [entries] = useState(initialEntries);

  return useMemo(
    () => ({
      formTitle: 'Income Certificate Application',
      currentQuestion: 'What is your full name?',
      language: 'Tamil + English',
      prompt:
        'I detected an application form. I will ask for one field at a time, confirm the recognized answer, and only then fill the page.',
      entries,
      suggestions: ['Repeat question', 'Explain field', 'Confirm answer'],
      confirmationMessage:
        'Please review the collected information carefully. The browser will submit the form only after you approve it.',
    }),
    [entries],
  );
}
