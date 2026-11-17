import { contributionTotals as t, contributionsByMonth, remittances, totals, type Kpi, type Remittance } from "../data";
import { downloadCsv, usd, usdShort } from "../csv";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { KpiCard } from "../components/KpiCard";
import { ChartCard } from "../components/ChartCard";
import { Card } from "../components/Card";
import { BarList } from "../components/BarList";
import { Table, type Column } from "../components/Table";
import { PageHeader } from "../components/PageHeader";
import { ContributionsChart, ContributionsTable } from "../charts/ContributionsChart";

const months = contributionsByMonth.length;
const last = contributionsByMonth[months - 1];

const kpiCards: Kpi[] = [
  { id: "total", label: "Total contributions", value: usdShort(t.total), delta: "Plan year to date, Jan–Oct" },
  { id: "employee", label: "Employee deferrals", value: usdShort(t.employee), delta: `${Math.round((t.employee / t.total) * 100)}% of total` },
  { id: "employer", label: "Employer match", value: usdShort(t.employer), delta: `${Math.round((t.employer / t.total) * 100)}% of total` },
  { id: "avg", label: "Avg. per participant", value: usd(Math.round(t.total / totals.enrolled / months)), delta: `Per month, across ${totals.enrolled.toLocaleString()} enrolled` },
];

const sources = [
  { label: "Pre-tax deferrals", value: t.pretax, display: usd(t.pretax) },
  { label: "Employer match", value: t.employer, display: usd(t.employer) },
  { label: "Roth deferrals", value: t.roth, display: usd(t.roth) },
  { label: "Rollovers in", value: t.rollovers, display: usd(t.rollovers), note: "not counted in totals" },
];

const columns: Column<Remittance>[] = [
  { key: "pay", header: "Pay date", sortValue: (r) => r.iso, render: (r) => r.payDate },
  { key: "employee", header: "Employee", align: "end", sortValue: (r) => r.employee, render: (r) => usd(r.employee) },
  { key: "employer", header: "Employer", align: "end", sortValue: (r) => r.employer, render: (r) => usd(r.employer) },
  { key: "total", header: "Total", align: "end", sortValue: (r) => r.employee + r.employer, render: (r) => <strong className="strong">{usd(r.employee + r.employer)}</strong> },
  { key: "posted", header: "Posted", align: "end", render: (r) => r.posted },
  { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => (r.status === "Posted" ? <Badge tone="positive" dot>Posted</Badge> : <Badge tone="info" dot>Scheduled</Badge>) },
];

export function ContributionsPage() {
  const exportRows = () =>
    downloadCsv(
      "northbridge-sample-contributions-by-month.csv",
      ["Month", "Employee deferrals", "Employer match", "Total"],
      contributionsByMonth.map((m) => [`${m.month} 2026`, m.employee, m.employer, m.employee + m.employer]),
    );

  return (
    <>
      <PageHeader
        title="Contributions"
        meta={<>Posted through Oct 31, 2026</>}
        actions={<Button variant="primary" onClick={exportRows}>Export CSV</Button>}
      />

      <section aria-labelledby="ckpi-heading">
        <h2 id="ckpi-heading" className="visually-hidden">Contribution totals</h2>
        <div className="kpi-grid">{kpiCards.map((k) => <KpiCard key={k.id} kpi={k} />)}</div>
      </section>

      <div className="chart-grid">
        <ChartCard
          title="Contributions by month"
          description={`Jan–Oct 2026 · October total ${usd(last.employee + last.employer)}`}
          chart={
            <>
              <ul className="nb-legend" aria-hidden="true">
                <li><span className="nb-legend__swatch nb-legend__swatch--series-1" />Employee deferrals</li>
                <li><span className="nb-legend__swatch nb-legend__swatch--series-2" />Employer match</li>
              </ul>
              <ContributionsChart />
            </>
          }
          table={<ContributionsTable />}
        />
        <Card title="By source" description="Plan year to date">
          <BarList label="Contributions by source" items={sources} />
        </Card>
      </div>

      <section className="nb-card" aria-labelledby="remit-title">
        <header className="nb-card__header">
          <div className="nb-card__titles">
            <h2 id="remit-title" className="nb-card__title">Payroll remittances</h2>
            <p className="nb-card__description">Last {remittances.length} semi-monthly payrolls · contributions post 1–2 business days after the pay date</p>
          </div>
        </header>
        <div className="nb-table-scroll" tabIndex={0} role="region" aria-label="Remittance table, scrolls sideways on small screens">
          <Table caption="Payroll remittances" columns={columns} rows={remittances} rowKey={(r) => r.iso} />
        </div>
      </section>
    </>
  );
}
