export function ProsePage({ eyebrow, title, children, note }: { eyebrow: string; title: string; children: React.ReactNode; note?: string }) {
  return (
    <article className="container-page max-w-3xl py-12 sm:py-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display mt-2 text-4xl text-pine sm:text-5xl">{title}</h1>
      {note && <p className="mt-4 rounded-xl bg-warning-bg p-4 text-sm text-warning-ink">{note}</p>}
      <div className="prose-masjid mt-8 space-y-4 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-pine [&_li]:ms-5 [&_ul]:list-disc">{children}</div>
    </article>
  );
}
