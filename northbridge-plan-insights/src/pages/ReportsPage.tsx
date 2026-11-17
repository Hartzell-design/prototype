import { useState } from "react";
import { contributionsByMonth, deferral, keyDates, participants, participation, remittances } from "../data";
import { downloadCsv } from "../csv";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Table, type Column } from "../components/Table";
import { PageHeader } from "../components/PageHeader";
import { exportDivisions } from "./EngagementPage";

interface Report { id: string; name: string; category: "Engagement" | "Participants" | "Contributions"; covers: string; run: () => void }

const reports: Report[] = [
  { id: "division", name: "Participation by division", category: "Engagement", covers: "As of Nov 13, 2026", run: exportDivisions },
  {
    id: "trend", name: "Participation trend", category: "Engagement", covers: "Dec 2025 – Nov 2026",
    run: () => downloadCsv("northbridge-sample-participation-trend.csv", ["Month", "Participation %"], participation.map((p) => [`${p.month} ${p.year}`, p.rate])),
  },
  {
    id: "deferral", name: "Deferral rate distribution", category: "Engagement", covers: "As of Nov 13, 2026",
    run: () => downloadCsv("northbridge-sample-deferral-distribution.csv", ["Deferral rate", "Participants"], deferral.map((d) => [d.band, d.count])),
  },
  {
    id: "directory", name: "Participant directory (sample records)", category: "Participants", covers: "As of Nov 13, 2026",
    run: () => downloadCsv("northbridge-sample-participants.csv", ["Participant", "ID", "Division", "Status", "Deferral %", "Beneficiary", "Hire date"],
      participants.map((p) => [p.name, p.id, p.division, p.status, p.deferral, p.beneficiary ?? "Not applicable", p.hired])),
  },
  {
    id: "beneficiary", name: "Missing beneficiary list (sample records)", category: "Participants", covers: "As of Nov 13, 2026",
    run: () => downloadCsv("northbridge-sample-missing-beneficiary.csv", ["Participant", "ID", "Division"],
      participants.filter((p) => p.beneficiary === "Missing").map((p) => [p.name, p.id, p.division])),
  },
  {
    id: "monthly", name: "Contributions by month", category: "Contributions", covers: "Jan – Oct 2026",
    run: () => downloadCsv("northbridge-sample-contributions-by-month.csv", ["Month", "Employee deferrals", "Employer match", "Total"],
      contributionsByMonth.map((m) => [`${m.month} 2026`, m.employee, m.employer, m.employee + m.employer])),
  },
  {
    id: "remit", name: "Payroll remittances", category: "Contributions", covers: "Aug 14 – Nov 14, 2026",
    run: () => downloadCsv("northbridge-sample-payroll-remittances.csv", ["Pay date", "Employee", "Employer", "Total", "Posted", "Status"],
      remittances.map((r) => [r.payDate, r.employee, r.employer, r.employee + r.employer, r.posted, r.status])),
  },
];

const CATEGORIES = ["All", "Engagement", "Participants", "Contributions"] as const;

export function ReportsPage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const rows = category === "All" ? reports : reports.filter((r) => r.category === category);

  const columns: Column<Report>[] = [
    { key: "name", header: "Report", sortValue: (r) => r.name, render: (r) => r.name },
    { key: "category", header: "Category", sortValue: (r) => r.category, render: (r) => <Badge tone="neutral">{r.category}</Badge> },
    { key: "covers", header: "Covers", render: (r) => r.covers },
    {
      key: "action", header: "Download", align: "end",
      render: (r) => (
        <Button size="sm" onClick={() => { r.run(); setDownloaded(r.name); }} aria-label={`Download ${r.name} as CSV`}>Download CSV</Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Reports" />

      <div className="stack">
        <section className="nb-card" aria-labelledby="reports-title">
          <header className="nb-card__header">
            <div className="nb-card__titles">
              <h2 id="reports-title" className="nb-card__title">Available reports</h2>
              <p className="nb-card__description">Every download is built from the sample data on these pages</p>
            </div>
            <div className="nb-segmented nb-segmented--sm" role="group" aria-label="Filter reports by category">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
          </header>
          <div className="nb-table-scroll" tabIndex={0} role="region" aria-label="Report table, scrolls sideways on small screens">
            <Table caption="Available reports" columns={columns} rows={rows} rowKey={(r) => r.id} />
          </div>
          <p className="visually-hidden" role="status">{downloaded ? `${downloaded} downloaded.` : ""}</p>
        </section>

        <Card title="Key dates" description="Plan year 2026" flush>
          <ol className="dates">
            {keyDates.map((d) => (
              <li key={d.iso} className="date">
                <time className="date__when num" dateTime={d.iso}>{d.date}</time>
                <span className="date__title">{d.title}</span>
                <span className="date__detail">{d.detail}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
