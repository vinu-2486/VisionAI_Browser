import { useEffect, useState } from "react";

interface HomePageProps {
  servicesOnly?: boolean;
  onOpenAssistant: () => void;
  onNavigate: (page: string) => void;
}

const services = [
  {
    title: "Income Certificate",
    short: "Income",
    description:
      "Complete income verification forms with guided assistance.",
    icon: "₹",
    tone: "cyan",
  },
  {
    title: "Community Certificate",
    short: "Community",
    description:
      "Understand and complete community certificate details.",
    icon: "◎",
    tone: "violet",
  },
  {
    title: "Nativity Certificate",
    short: "Nativity",
    description:
      "Follow a clear guided flow for your nativity application.",
    icon: "⌖",
    tone: "blue",
  },
  {
    title: "Scholarship Application",
    short: "Scholarship",
    description:
      "Fill scholarship applications without getting lost in forms.",
    icon: "★",
    tone: "amber",
  },
  {
    title: "Pension Application",
    short: "Pension",
    description:
      "Navigate pension-related government applications step by step.",
    icon: "♙",
    tone: "emerald",
  },
];

const workflow = [
  ["01", "Speak", "Tell VisionAI what you need."],
  ["02", "Understand", "AI identifies the webpage and form."],
  ["03", "Guide", "Questions are asked one at a time."],
  ["04", "Fill", "Recognized information is inserted."],
  ["05", "Confirm", "You review everything before submission."],
];

export default function HomePage({
  servicesOnly = false,
  onOpenAssistant,
  onNavigate,
}: HomePageProps) {
  const [selectedService, setSelectedService] =
    useState<string | null>(null);

  const [clock, setClock] = useState(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const scrollToServices = () => {
    document
      .getElementById("services")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="dashboard">

      {!servicesOnly && (
        <>
          {/* HERO */}
          <section className="hero-v2">

            <div className="hero-noise" />

            <div className="hero-grid-lines" />

            <div className="hero-copy">

              <div className="hero-label">
                <span className="hero-label-dot" />
                AI-POWERED ACCESSIBILITY
              </div>

              <div className="hero-heading">
                <span>
                  Government services.
                </span>

                <strong>
                  Without the complexity.
                </strong>
              </div>

              <p className="hero-description">
                VisionAI turns complicated online government
                forms into simple conversations. Speak naturally.
                Let the browser understand the page. Stay in
                control from start to finish.
              </p>

              <div className="hero-actions">

                <button
                  className="primary-cta"
                  onClick={onOpenAssistant}
                >
                  <span className="cta-symbol">◉</span>

                  <span>
                    <small>START WITH VOICE</small>
                    Open Assistant
                  </span>

                  <b>→</b>
                </button>

                <button
                  className="secondary-cta"
                  onClick={scrollToServices}
                >
                  Explore services
                  <span>↓</span>
                </button>

              </div>

              <div className="hero-trust">

                <span>
                  <i>✓</i>
                  Tamil + English
                </span>

                <span>
                  <i>✓</i>
                  Voice guided
                </span>

                <span>
                  <i>✓</i>
                  User controlled
                </span>

              </div>
            </div>

            {/* AI CONTROL CARD */}
            <div className="ai-console">

              <div className="console-top">

                <div>
                  <small>VISIONAI CORE</small>

                  <h3>
                    Conversational mode
                  </h3>
                </div>

                <div className="console-live">
                  <span />
                  LIVE
                </div>
              </div>

              <div className="console-visual">

                <div className="orbital-ring ring-one" />
                <div className="orbital-ring ring-two" />

                <div className="ai-orb">
                  <span>V</span>
                </div>

                <div className="orbit-node node-one" />
                <div className="orbit-node node-two" />

              </div>

              <div className="console-status">

                <div className="status-title">
                  <span className="mini-pulse" />

                  Listening layer ready
                </div>

                <div className="audio-bars">
                  {[
                    18,
                    34,
                    22,
                    50,
                    32,
                    64,
                    40,
                    27,
                    55,
                  ].map((height, index) => (
                    <i
                      key={index}
                      style={{
                        height: `${height}px`,
                        animationDelay: `${
                          index * 0.09
                        }s`,
                      }}
                    />
                  ))}
                </div>

              </div>

              <div className="ai-message-preview">

                <div className="ai-avatar">
                  AI
                </div>

                <div>
                  <small>VisionAI</small>

                  <p>
                    “Tell me what government service
                    you need help with.”
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* METRICS */}
          <section className="metric-row">

            <div className="metric">
              <span>Supported services</span>
              <strong>05</strong>
            </div>

            <div className="metric">
              <span>Languages</span>
              <strong>02</strong>
            </div>

            <div className="metric">
              <span>Assistance</span>
              <strong>24<span>/7</span></strong>
            </div>

            <div className="metric">
              <span>User control</span>
              <strong>100<span>%</span></strong>
            </div>

            <div className="metric time-metric">
              <span>Local time</span>
              <strong>{clock}</strong>
            </div>

          </section>
        </>
      )}

      {/* SERVICES */}
      <section
        id="services"
        className="product-section"
      >

        <div className="section-heading-row">

          <div>
            <div className="eyebrow">
              GOVERNMENT SERVICES
            </div>

            <h2>
              What can VisionAI help you complete?
            </h2>

            <p>
              Choose a service and let the assistant guide
              you through the application.
            </p>
          </div>

          <div className="service-count-badge">
            <span />
            {services.length} ACTIVE SERVICES
          </div>

        </div>

        <div className="service-grid-v2">

          {services.map((service, index) => (
            <button
              key={service.title}
              className={`product-card ${service.tone}`}
              onClick={() =>
                setSelectedService(service.title)
              }
            >

              <div className="product-card-top">

                <div className="product-icon">
                  {service.icon}
                </div>

                <span className="card-index">
                  0{index + 1}
                </span>

              </div>

              <div className="product-card-content">

                <h3>
                  {service.title}
                </h3>

                <p>
                  {service.description}
                </p>

              </div>

              <div className="product-card-footer">

                <span>
                  Start application
                </span>

                <b>↗</b>

              </div>

            </button>
          ))}

        </div>
      </section>

      {/* WORKFLOW */}
      {!servicesOnly && (
        <section className="product-section">

          <div className="section-heading-row">
            <div>
              <div className="eyebrow">
                THE EXPERIENCE
              </div>

              <h2>
                Simple for the user. Intelligent underneath.
              </h2>
            </div>
          </div>

          <div className="workflow-v2">

            {workflow.map(
              ([number, title, description], index) => (
                <div
                  key={number}
                  className="workflow-card"
                >

                  <div className="workflow-top">
                    <span>{number}</span>

                    {index <
                      workflow.length - 1 && (
                      <i />
                    )}
                  </div>

                  <h3>{title}</h3>

                  <p>{description}</p>
                </div>
              )
            )}

          </div>

        </section>
      )}

      {/* LIVE ACTIVITY */}
      {!servicesOnly && (
        <section className="product-section">

          <div className="section-heading-row">

            <div>
              <div className="eyebrow">
                YOUR SPACE
              </div>

              <h2>
                Continue where you left off.
              </h2>
            </div>

            <button
              className="text-button"
              onClick={() => onNavigate("History")}
            >
              View history →
            </button>

          </div>

          <div className="activity-v2">

            <div className="activity-feature">

              <div className="activity-feature-icon">
                ₹
              </div>

              <div className="activity-feature-content">
                <small>
                  DRAFT APPLICATION
                </small>

                <h3>
                  Income Certificate
                </h3>

                <p>
                  4 of 5 steps completed.
                  Your information is ready for review.
                </p>

                <div className="activity-progress">
                  <div>
                    <span />
                  </div>

                  <small>
                    82% complete
                  </small>
                </div>
              </div>

              <button
                className="continue-button"
                onClick={() =>
                  onNavigate("History")
                }
              >
                Continue →
              </button>

            </div>

            <div className="activity-list">

              <div className="activity-item">
                <div className="activity-dot cyan" />

                <div>
                  <strong>
                    Scholarship Application
                  </strong>

                  <span>
                    Review completed · Yesterday
                  </span>
                </div>

                <b>✓</b>
              </div>

              <div className="activity-item">
                <div className="activity-dot blue" />

                <div>
                  <strong>
                    Nativity Certificate
                  </strong>

                  <span>
                    Application started · 2 days ago
                  </span>
                </div>

                <b>→</b>
              </div>

            </div>

          </div>
        </section>
      )}

      {selectedService && (
        <div className="service-launch">

          <div>
            <small>
              SELECTED SERVICE
            </small>

            <strong>
              {selectedService}
            </strong>
          </div>

          <button
            onClick={onOpenAssistant}
          >
            Start with VisionAI
            <span>→</span>
          </button>

          <button
            className="launch-close"
            onClick={() =>
              setSelectedService(null)
            }
          >
            ×
          </button>

        </div>
      )}

    </div>
  );
}