interface HeaderProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onAssistant: () => void;
}

export default function Header({
  activePage,
  onNavigate,
  onAssistant,
}: HeaderProps) {
  const navItems = [
    "Home",
    "Services",
    "History",
    "Settings",
  ];

  return (
    <header className="topbar">
      <div className="topbar-inner">

        <button
          className="brand"
          onClick={() => onNavigate("Home")}
        >
          <div className="logo-orbit">
            <div className="logo-core">V</div>

            <div className="logo-ring" />

            <span className="logo-status" />
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              Vision<span>AI</span>
            </div>

            <div className="brand-subtitle">
              ACCESSIBLE BROWSER
            </div>
          </div>
        </button>

        <nav className="desktop-nav">
          {navItems.map((item) => (
            <button
              key={item}
              className={
                activePage === item
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => onNavigate(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <div className="system-status">
            <span />
            System ready
          </div>

          <button
            className="assistant-button"
            onClick={onAssistant}
          >
            <span className="assistant-button-icon">◉</span>
            <span>Open Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
}