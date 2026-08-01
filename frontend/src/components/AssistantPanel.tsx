import type { FormFlowState } from '../hooks/useFormFlow';

type Props = {
  formFlow: FormFlowState;
};

export default function AssistantPanel({ formFlow }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Assistant</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Voice-guided form filling</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Prototype</span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Active form</p>
          <p className="mt-1 font-semibold text-slate-900">{formFlow.formTitle}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Current step</p>
          <p className="mt-1 font-semibold text-slate-900">{formFlow.currentQuestion}</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-dashed border-teal-200 bg-teal-50/60 p-5">
        <p className="text-sm font-medium text-teal-900">Assistant prompt</p>
        <p className="mt-2 leading-7 text-slate-800">{formFlow.prompt}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {formFlow.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
