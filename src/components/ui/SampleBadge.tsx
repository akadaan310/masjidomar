export function SampleBadge({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span className="badge border border-brass/60 bg-warning-bg text-warning-ink" title="Sample content for a private demo — not real masjid information">
      Sample
    </span>
  );
}
