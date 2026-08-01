import Header from './components/Header';
import AssistantPanel from './components/AssistantPanel';
import FormSummary from './components/FormSummary';
import HomePage from './pages/HomePage';
import { useFormFlow } from './hooks/useFormFlow';

export default function App() {
  const formFlow = useFormFlow();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(21,184,166,0.18),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef7fb_45%,#ffffff_100%)] text-slate-900">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
        <HomePage formFlow={formFlow} />
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <AssistantPanel formFlow={formFlow} />
          <FormSummary formFlow={formFlow} />
        </section>
      </main>
    </div>
  );
}
