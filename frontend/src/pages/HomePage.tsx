import type { FormFlowState } from '../hooks/useFormFlow';

type Props = {
  formFlow: FormFlowState;
};

export default function HomePage({ formFlow }: Props) {
  return (
    <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-900">
          Society oriented accessibility project
        </p>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          Help users complete government forms through a guided voice conversation.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          The prototype detects form fields, asks for each required value in simple language, validates the answer, and fills the webpage only after user confirmation.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Speech to text</span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">DOM analysis</span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Validation</span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">User confirmation</span>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.75rem] bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white">
        <div>
          <p className="text-sm text-slate-300">Demo state</p>
          <p className="mt-2 text-2xl font-semibold">{formFlow.formTitle}</p>
        </div>
        <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
          <p className="text-sm text-slate-300">Detected field</p>
          <p className="mt-1 font-medium">{formFlow.currentQuestion}</p>
        </div>
        <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
          <p className="text-sm text-slate-300">User language</p>
          <p className="mt-1 font-medium">{formFlow.language}</p>
        </div>
      </div>
    </section>
  );
}
