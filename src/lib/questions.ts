export const STATUS_META: Record<string, { label: string; tone: string; description: string }> = {
  submitted: { label: "Submitted", tone: "bg-sand text-pine", description: "Received privately. Waiting for the imam to open it." },
  acknowledged: { label: "Acknowledged", tone: "bg-sage-100 text-pine", description: "The imam has seen your question and will reply." },
  needs_clarification: { label: "Needs clarification", tone: "bg-warning-bg text-warning-ink", description: "The imam asked a follow-up question — please reply." },
  answered: { label: "Answered", tone: "bg-evergreen text-ivory", description: "A reply is waiting for you." },
  closed: { label: "Closed", tone: "bg-pine/10 text-muted", description: "This conversation is closed. The record is kept for you." },
};

export const CATEGORY_LABELS: Record<string, string> = {
  worship: "Worship & prayer",
  family: "Family & relationships",
  new_muslim: "New to Islam",
  community: "Community & masjid life",
  other: "Something else",
  visiting: "Visiting",
};

export function StatusSteps(status: string) {
  const order = ["submitted", "acknowledged", "answered", "closed"];
  const idx = status === "needs_clarification" ? 1 : order.indexOf(status);
  return order.map((s, i) => ({ key: s, label: STATUS_META[s].label, done: i <= idx }));
}
