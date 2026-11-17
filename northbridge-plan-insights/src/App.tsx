import { useMemo, useState } from "react";
import { alert, divisions, kpis, plan, plans, type Division } from "./data";
import { useTheme } from "./theme";
import { TopNavBar, type Section } from "./components/TopNavBar";
import { ThemeToggle } from "./components/ThemeToggle";
import { Button } from "./components/Button";
import { Badge } from "./components/Badge";
import { Alert } from "./components/Alert";
import { KpiCard } from "./components/KpiCard";
import { ChartCard } from "./components/ChartCard";
import { Input } from "./components/Field";
import { Table, type Column } from "./components/Table";
import { ParticipationChart, ParticipationTable } from "./charts/ParticipationChart";
import { DeferralChart, DeferralTable } from "./charts/DeferralChart";
import "./App.css";

const pct = (n: number) => `${n.toFixed(1)}%`;

const columns: Column<Division>[] = [
  {
    key: "division",
    header: "Division / location",
    sortValue: (d) => d.name,
    render: (d) => (
      <span className="division">
        <span className="division__name">{d.name}</span>
        <span className="division__loc">{d.location}</span>
      </span>
    ),
  },
  { key: "eligible", header: "Eligible", align: "end", sortValue: (d) => d.eligible, render: (d) => d.eligible.toLocaleString() },
  { key: "enrolled", header: "Enrolled", align: "end", sortValue: (d) => d.enrolled, render: (d) => d.enrolled.toLocaleString() },
  {
    key: "participation",
    header: "Participation",
    align: "end",
    sortValue: (d) => d.participation,
    render: (d) => (
      <span className="meter">
        <span className="meter__track" aria-hidden="true"><span className="meter__fill" style={{ inlineSize: `${d.participation}%` }} /></span>
        {pct(d.participation)}
      </span>
    ),
  },
  { key: "deferral", header: "Avg. deferral", align: "end", sortValue: (d) => d.avgDeferral, render: (d) => pct(d.avgDeferral) },
  {
    key: "status",
    header: "Status",
    sortValue: (d) => d.status,
    render: (d) => (d.status === "on-track" ? <Badge tone="positive" dot>On track</Badge> : <Badge tone="warning" dot>Needs review</Badge>),
  },
];

function exportCsv() {
  const head = ["Division", "Location", "Eligible", "Enrolled", "Participation %", "Avg. deferral %", "Status"];
  const rows = divisions.map((d) => [d.name, d.location, d.eligible, d.enrolled, d.participation, d.avgDeferral, d.status === "on-track" ? "On track" : "Needs review"]);
  const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`# Sample data - fictional plan\n${csv}\n`], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "northbridge-sample-participation-by-division.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [theme, setTheme] = useTheme();
  const [section, setSection] = useState<Section>("Overview");
  const [reminder, setReminder] = useState(false);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? divisions.filter((d) => `${d.name} ${d.location}`.toLowerCase().includes(q)) : divisions;
  }, [query]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>

      <aside className="proto-bar" aria-label="Prototype controls">
        <div className="proto-bar__inner">
          <p className="proto-bar__note">
            <Badge tone="info">Prototype</Badge>
            <span>Northbridge is fictional. All figures are sample data.</span>
          </p>
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>
      </aside>

      <TopNavBar current={section} onNavigate={setSection} plans={plans} user={plan.user} />

      <main id="main" tabIndex={-1} className="page">
        {section !== "Overview" ? (
          <section className="nb-card placeholder" aria-labelledby="placeholder-title">
            <h1 id="placeholder-title" className="page__title">{section}</h1>
            <p>This screen isn't part of the prototype. The Overview page is the one rebuilt on the Northbridge 2026 design system.</p>
            <div><Button variant="primary" onClick={() => setSection("Overview")}>Back to Overview</Button></div>
          </section>
        ) : (
          <>
            <div className="page__header">
              <div className="page__heading">
                <h1 className="page__title">Plan engagement</h1>
                <p className="page__meta">
                  <span>{plan.name}</span>
                  <span className="page__sep" aria-hidden="true">·</span>
                  <span className="num">Data as of {plan.asOf}</span>
                  <Badge tone="neutral">Sample data</Badge>
                </p>
              </div>
              <div className="page__actions">
                <Button onClick={() => window.print()}>Print</Button>
                <Button variant="primary" onClick={exportCsv}>Export CSV</Button>
              </div>
            </div>

            <Alert
              tone="warning"
              title="Beneficiary designations missing"
              action={
                <Button size="sm" variant={reminder ? "secondary" : "primary"} disabled={reminder} onClick={() => setReminder(true)}>
                  {reminder ? "Reminder drafted" : "Send reminder"}
                </Button>
              }
            >
              {alert.message}
            </Alert>
            <p className="visually-hidden" role="status">{reminder ? `Reminder drafted for ${alert.count} participants. This is a prototype, so nothing was sent.` : ""}</p>

            <section aria-labelledby="kpi-heading">
              <h2 id="kpi-heading" className="visually-hidden">Key metrics</h2>
              <div className="kpi-grid">
                {kpis.map((k) => <KpiCard key={k.id} kpi={k} />)}
              </div>
            </section>

            <div className="chart-grid">
              <ChartCard
                className="chart-grid__wide"
                title="Participation rate"
                description="Last 12 months, Dec 2025 – Nov 2026"
                chart={<ParticipationChart />}
                table={<ParticipationTable />}
              />
              <ChartCard
                title="Deferral rate distribution"
                description="Participants by elected deferral rate"
                chart={<DeferralChart />}
                table={<DeferralTable />}
              />
            </div>

            <section className="nb-card" aria-labelledby="division-title">
              <header className="nb-card__header">
                <div className="nb-card__titles">
                  <h2 id="division-title" className="nb-card__title">Participation by division</h2>
                  <p className="nb-card__description">{divisions.length} divisions · select a column heading to sort</p>
                </div>
                <Input className="division-filter" label="Filter divisions" hideLabel placeholder="Filter by division or location" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
              </header>
              <div className="nb-table-scroll" tabIndex={0} role="region" aria-label="Division table, scrolls sideways on small screens">
                <Table caption="Participation by division" columns={columns} rows={rows} rowKey={(d) => d.name} empty={`No divisions match “${query}”.`} />
              </div>
            </section>
          </>
        )}
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
