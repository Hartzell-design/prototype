import { useId, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import "./Field.css";

type Tone = "default" | "inverse";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hideLabel?: boolean;
  tone?: Tone;
  options: string[];
}

/** Native <select> for full keyboard and screen-reader support, styled with tokens. */
export function Select({ label, hideLabel, tone = "default", options, className, ...rest }: SelectProps) {
  const id = useId();
  return (
    <div className={["nb-field", `nb-field--${tone}`, className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={hideLabel ? "visually-hidden" : "nb-field__label"}>{label}</label>
      <div className="nb-field__control nb-field__control--select">
        <select id={id} {...rest}>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <svg className="nb-field__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 6l4 4 4-4" /></svg>
      </div>
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
}

export function Input({ label, hideLabel, className, ...rest }: InputProps) {
  const id = useId();
  return (
    <div className={["nb-field", "nb-field--default", className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={hideLabel ? "visually-hidden" : "nb-field__label"}>{label}</label>
      <div className="nb-field__control">
        <svg className="nb-field__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
        <input id={id} {...rest} />
      </div>
    </div>
  );
}
