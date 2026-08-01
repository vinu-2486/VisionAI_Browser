import type { FormFlowState } from '../hooks/useFormFlow';

type Props = {
  formFlow: FormFlowState;
};

export default function FormSummary({ formFlow }: Props) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200">Summary</p>
      <h2 className="mt-2 text-2xl font-semibold">Collected information</h2>
      <div className="mt-6 space-y-4">
        {formFlow.entries.map((entry) => (
          <div key={entry.label} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
            <p className="text-sm text-slate-300">{entry.label}</p>
            <p className="mt-1 text-base font-medium text-white">{entry.value || 'Awaiting input'}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
        <p className="text-sm text-slate-300">Confirmation</p>
        <p className="mt-1 text-white">{formFlow.confirmationMessage}</p>
      </div>
    </aside>
  );
}
