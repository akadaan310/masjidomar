import { AlertTriangle, BadgeCheck, Clock } from "lucide-react";
import type { PrayerBoard } from "@/lib/prayer/data";
import { formatLongDate } from "@/lib/prayer/engine";

export function PrayerStateBanner({ board, compact = false }: { board: Pick<PrayerBoard, "state" | "publication">; compact?: boolean }) {
  if (board.state === "sample") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl border-2 border-brass bg-warning-bg p-4 text-warning-ink">
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-bold">Demo schedule — not current prayer times</p>
          {!compact && (
            <p className="text-sm">
              Iqamah times shown here are placeholders for a private demonstration. The masjid has not published a schedule. Please confirm times with the masjid.
            </p>
          )}
        </div>
      </div>
    );
  }
  if (board.state === "awaiting") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-pine/15 bg-sand/60 p-4 text-pine">
        <Clock aria-hidden className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-bold">Schedule awaiting confirmation</p>
          {!compact && (
            <p className="text-sm">
              Congregational (iqamah) times have not yet been confirmed by the masjid. Calculated adhan times below are astronomical estimates only.
            </p>
          )}
        </div>
      </div>
    );
  }
  const verified = board.publication?.verified_at ? new Date(board.publication.verified_at) : null;
  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl border border-evergreen/25 bg-sage-100 p-4 text-pine">
      <BadgeCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-evergreen" />
      <p className="text-sm">
        <span className="font-bold">Published by masjid administration.</span>{" "}
        {verified && <>Last verified {formatLongDate(verified)}.</>}
      </p>
    </div>
  );
}
