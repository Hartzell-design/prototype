import { useEffect, useRef, useState } from "react";
import { plan, plans } from "./data";
import { useTheme } from "./theme";
import { TopNavBar, sections, type Section } from "./components/TopNavBar";
import { ThemeToggle } from "./components/ThemeToggle";
import { Badge } from "./components/Badge";
import { OverviewPage } from "./pages/OverviewPage";
import { EngagementPage } from "./pages/EngagementPage";
import { ParticipantsPage } from "./pages/ParticipantsPage";
import { ContributionsPage } from "./pages/ContributionsPage";
import { ReportsPage } from "./pages/ReportsPage";
import "./App.css";
import "./pages/pages.css";
import "./styles/legacy-skin.css";
import { LegacyDefs } from "./components/LegacyDefs";

const DEFAULT: Section = "Engagement";

/** Routes are hashes: #overview, #engagement, #participants?beneficiary=missing, ... */
function parseHash(): { section: Section | null; params: URLSearchParams } {
  const [path, query = ""] = window.location.hash.replace(/^#/, "").split("?");
  const section = sections.find((s) => s.toLowerCase() === path.toLowerCase()) ?? null;
  return { section, params: new URLSearchParams(query) };
}

export function App() {
  const [theme, setTheme] = useTheme();
  const [route, setRoute] = useState(() => {
    const r = parseHash();
    return { section: r.section ?? DEFAULT, params: r.params };
  });
  const [reminder, setReminder] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const onHash = () => {
      const r = parseHash();
      // Ignore in-page anchors such as the skip link (#main).
      if (r.section) setRoute({ section: r.section, params: r.params });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // On tab change: update the title, move focus to the new page and scroll to the top.
  useEffect(() => {
    document.title = `${route.section} · Northbridge Plan Insights`;
    if (first.current) { first.current = false; return; }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [route]);

  const { section, params } = route;

  return (
    <>
      <LegacyDefs />
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to main content</a>

      <aside className="proto-bar" aria-label="Prototype controls">
        <div className="proto-bar__inner">
          <p className="proto-bar__note">
            <Badge tone="info">Prototype</Badge>
            <span>Northbridge is fictional. All figures are sample data.</span>
          </p>
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>
      </aside>

      <TopNavBar current={section} plans={plans} user={plan.user} />

      <main id="main" ref={mainRef} tabIndex={-1} className="page" aria-label={section}>
        {section === "Overview" && <OverviewPage reminder={reminder} />}
        {section === "Engagement" && <EngagementPage reminder={reminder} onReminder={() => setReminder(true)} />}
        {section === "Participants" && (
          <ParticipantsPage key={params.toString()} initialBeneficiary={params.get("beneficiary") ?? undefined} reminder={reminder} onReminder={() => setReminder(true)} />
        )}
        {section === "Contributions" && <ContributionsPage />}
        {section === "Reports" && <ReportsPage />}
        <p className="visually-hidden" role="status">
          {reminder ? "Beneficiary reminder drafted for 42 participants. This is a prototype, so nothing was sent." : ""}
        </p>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p>© 2026 Northbridge (fictional). Plan Insights prototype.</p>
          <p>
            Compare the originals: <a href="legacy/legacy-a-2011.html">2011 version</a> · <a href="legacy/legacy-b-2016.html">2016 version</a>
          </p>
        </div>
      </footer>
    </>
  );
}
