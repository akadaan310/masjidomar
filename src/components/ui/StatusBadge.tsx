import { STATUS_META } from "@/lib/questions";

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, tone: "bg-sand text-pine" };
  return <span className={`badge ${m.tone}`}>{m.label}</span>;
}
