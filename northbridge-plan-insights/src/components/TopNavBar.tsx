import { Logo } from "./Logo";
import { Tab } from "./Tab";
import { Select } from "./Field";
import "./TopNavBar.css";

export const sections = ["Overview", "Engagement", "Participants", "Contributions", "Reports"] as const;
export type Section = (typeof sections)[number];

interface TopNavBarProps {
  current: Section;
  plans: string[];
  user: { name: string; initials: string };
}

export function TopNavBar({ current, plans, user }: TopNavBarProps) {
  return (
    <header className="nb-topnav">
      <div className="nb-topnav__inner">
        <Logo />
        <nav className="nb-topnav__tabs" aria-label="Primary">
          {sections.map((s) => (
            <Tab key={s} href={`#${s.toLowerCase()}`} current={s === current}>{s}</Tab>
          ))}
        </nav>
        <div className="nb-topnav__right">
          <Select className="nb-topnav__plan" tone="inverse" label="Plan" hideLabel options={plans} />
          <span className="nb-topnav__avatar" role="img" aria-label={`Signed in as ${user.name}`}>{user.initials}</span>
        </div>
      </div>
    </header>
  );
}
