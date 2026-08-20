import { useState } from "react";
import Header from "./components/Header";
import AssistantPanel from "./components/AssistantPanel";
import FormSummary from "./components/FormSummary";
import HomePage from "./pages/HomePage";

type Page = "Home" | "Services" | "History" | "Settings";

export default function App() {
  const [page, setPage] = useState<Page>("Home");
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <Header
        activePage={page}
        onNavigate={(nextPage) => setPage(nextPage as Page)}
        onAssistant={() => setAssistantOpen(true)}
      />

      <main className="page-container">
        {page === "Home" && (
          <HomePage
            onOpenAssistant={() => setAssistantOpen(true)}
            onNavigate={(nextPage) =>
              setPage(nextPage as Page)
            }
          />
        )}

        {page === "Services" && (
          <HomePage
            servicesOnly
            onOpenAssistant={() => setAssistantOpen(true)}
            onNavigate={(nextPage) =>
              setPage(nextPage as Page)
            }
          />
        )}

        {page === "History" && <FormSummary />}

        {page === "Settings" && (
          <section className="settings-page">
            <div className="settings-panel">
              <div className="eyebrow">PREFERENCES</div>

              <h1>Settings</h1>

              <p>
                Control how VisionAI communicates, assists and
                confirms information.
              </p>

              <div className="settings-grid">
                <div className="setting-card">
                  <div className="setting-icon">◉</div>

                  <div>
                    <small>Language</small>
                    <strong>English + தமிழ்</strong>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-icon">◌</div>

                  <div>
                    <small>Voice assistant</small>
                    <strong className="success-text">
                      Enabled
                    </strong>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-icon">✓</div>

                  <div>
                    <small>Submission mode</small>
                    <strong>Always confirm</strong>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-icon">◫</div>

                  <div>
                    <small>Accessibility mode</small>
                    <strong>Enhanced</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}