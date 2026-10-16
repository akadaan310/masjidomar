import { Info } from "lucide-react";

export function ConceptBanner({ text }: { text: string }) {
  return (
    <div role="note" aria-label="Preview notice" className="bg-pine text-ivory">
      <p className="container-page flex items-start gap-2 py-2 text-[0.82rem] leading-snug sm:items-center">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-brass sm:mt-0" />
        <span>{text}</span>
      </p>
    </div>
  );
}
