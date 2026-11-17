import { alert, contributionTotals, divisions, keyDates, kpis, planDetails, totals } from "../data";
import { usdShort } from "../csv";
import { ButtonLink } from "../components/Button";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";

const participation = kpis.find((k) => k.id === "participation")!;
const review = divisions.filter((d) => d.status === "needs-review");

interface Summary { href: string; section: string; value: string; label: string; note: string }
const summaries: Summary[] = [
  { href: "#engagement", section: "Engagement", value: participation.value, label: "participation rate", note: participation.delta ?? "" },
  { href: "#participants", section: "Participants", value: totals.enrolled.toLocaleString(), label: `enrolled of ${totals.eligible.toLocaleString()} eligible`, note: `${totals.notEnrolled} not yet enrolled` },
  { href: "#contributions", section: "Contributions", value: usdShort(contributionTotals.total), label: "contributed this plan year", note: "Jan–Oct 2026, employee and employer" },
  { href: "#reports", section: "Reports", value: String(keyDates.length), label: "key dates ahead", note: `Next: ${keyDates[0].title.toLowerCase()} on ${keyDates[0].date}` },
];

export function OverviewPage({ reminder }: { reminder: boolean }) {
  const tasks = [
    {
      tone: reminder ? ("positive" as const) : ("warning" as const),
      status: reminder ? "Reminder drafted" : "Action needed",
      title: `${alert.count} participants missing a beneficiary`,
      detail: "Send a reminder before the plan-year close on Dec 31.",
      href: "#participants?beneficiary=missing",
      cta: "Review participants",
    },
    ...review.map((d) => ({
      tone: "warning" as const,
      status: "Needs review",
      title: `${d.name} participation at ${d.participation.toFixed(1)}%`,
      detail: `${d.eligible - d.enrolled} of ${d.eligible} eligible ${d.name} employees aren't enrolled.`,
      href: "#engagement",
      cta: "Open Engagement",
    })),
    {
      tone: "info" as const,
      status: "Upcoming",
      title: "Year-end census due Jan 15, 2027",
      detail: "Hours, pay and hire dates for every eligible employee.",
      href: "#reports",
      cta: "Open Reports",
    },
  ];

  return (
    <>
      <PageHeader title="Overview" />

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="visually-hidden">Plan at a glance</h2>
        <ul className="summary-grid">
          {summaries.map((s) => (
            <li key={s.section}>
              <a className="summary" href={s.href}>
                <span className="summary__section">{s.section}</span>
                <span className="summary__value num">{s.value}</span>
                <span className="summary__label">{s.label}</span>
                <span className="summary__note num">{s.note}</span>
                <span className="summary__go" aria-hidden="true">Open {s.section} →</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="split">
        <Card title="Needs attention" description={`${tasks.length} items for this plan`} flush>
          <ul className="tasks">
            {tasks.map((t) => (
              <li key={t.title} className="task">
                <Badge tone={t.tone} dot>{t.status}</Badge>
                <div className="task__body">
                  <h3 className="task__title num">{t.title}</h3>
                  <p className="task__detail">{t.detail}</p>
                </div>
                <ButtonLink size="sm" href={t.href} aria-label={`${t.cta}: ${t.title}`}>{t.cta}</ButtonLink>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Plan details">
          <dl className="nb-deflist">
            {planDetails.map((d) => (
              <div key={d.term} className="nb-deflist__row">
                <dt>{d.term}</dt>
                <dd>{d.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
