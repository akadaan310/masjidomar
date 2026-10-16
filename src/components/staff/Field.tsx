export function Field({ label, name, defaultValue, type = "text", hint, required, maxLength, rows, dir, min, max }: {
  label: string; name: string; defaultValue?: string | number | null; type?: string; hint?: string; required?: boolean; maxLength?: number; rows?: number; dir?: "auto" | "rtl" | "ltr"; min?: number | string; max?: number | string;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      {rows ? (
        <textarea id={id} name={name} defaultValue={defaultValue ?? ""} rows={rows} maxLength={maxLength} required={required} className="input" dir={dir} />
      ) : (
        <input id={id} name={name} type={type} defaultValue={defaultValue ?? ""} maxLength={maxLength} required={required} className="input" dir={dir} min={min} max={max} />
      )}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function SelectField({ label, name, options, defaultValue }: { label: string; name: string; options: [string, string][]; defaultValue?: string | null }) {
  return (
    <div>
      <label className="field-label" htmlFor={`f-${name}`}>{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={defaultValue ?? undefined} className="input">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

export function Check({ label, name, defaultChecked }: { label: React.ReactNode; name: string; defaultChecked?: boolean | null }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={Boolean(defaultChecked)} className="mt-0.5 size-5" /> <span>{label}</span>
    </label>
  );
}

/** ISO instant → "YYYY-MM-DDTHH:MM" in America/New_York for datetime-local inputs. */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}
