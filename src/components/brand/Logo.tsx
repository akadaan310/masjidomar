// Masjid Omar proposed identity (DRAFT — not approved by the masjid).
// The mark frames the masjid's real entrance — a small gabled porch with a glass-lit door and
// sidelights — inside a pointed arch. Wordmarks are live text (not outlines) so Arabic is shaped
// by the font engine and remains accessible and translatable.

type Tone = "color" | "mono" | "reverse";

const toneColors: Record<Tone, { stroke: string; accent: string; glass: string }> = {
  color: { stroke: "#145B40", accent: "#C3A66F", glass: "#B8C7B5" },
  mono: { stroke: "currentColor", accent: "currentColor", glass: "currentColor" },
  reverse: { stroke: "#F8F6F0", accent: "#C3A66F", glass: "#B8C7B5" },
};

export function LogoMark({ tone = "color", className = "", title }: { tone?: Tone; className?: string; title?: string }) {
  const c = toneColors[tone];
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      {/* Pointed arch */}
      <path
        d="M50 5 C62 20 91 30 91 63 V115 H9 V63 C9 30 38 20 50 5 Z"
        stroke={c.stroke}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Crescent at the apex */}
      <path d="M53.5 21.5 a7.5 7.5 0 1 1 -7 -10.5 a6 6 0 1 0 7 10.5 Z" fill={c.accent} />
      {/* Gabled porch */}
      <path d="M22 66 L50 45 L78 66" stroke={c.stroke} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M28 62 V115 M72 62 V115" stroke={c.stroke} strokeWidth="4.5" strokeLinecap="round" />
      {/* Sign band on the gable */}
      <rect x="41" y="55" width="18" height="5" rx="1.5" fill={c.accent} />
      {/* Door with glass panel, flanked by sidelights */}
      <rect x="43" y="73" width="14" height="42" rx="1.5" stroke={c.stroke} strokeWidth="3.5" />
      <rect x="46.5" y="78" width="7" height="12" rx="1" fill={c.glass} />
      <rect x="35" y="75" width="4.5" height="34" rx="1" fill={c.glass} />
      <rect x="60.5" y="75" width="4.5" height="34" rx="1" fill={c.glass} />
    </svg>
  );
}

export function Logo({
  variant = "horizontal",
  tone = "color",
  className = "",
}: {
  variant?: "horizontal" | "stacked" | "icon";
  tone?: Tone;
  className?: string;
}) {
  const textColor = tone === "reverse" ? "text-ivory" : tone === "mono" ? "" : "text-pine";
  const arColor = tone === "reverse" ? "text-sage" : tone === "mono" ? "" : "text-evergreen";
  if (variant === "icon") return <LogoMark tone={tone} className={className} title="Masjid Omar" />;
  if (variant === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center gap-2 text-center ${className}`}>
        <LogoMark tone={tone} className="h-20 w-auto" />
        <span className={`font-display text-2xl leading-none font-medium ${textColor}`}>Masjid Omar</span>
        <span lang="ar" dir="rtl" className={`text-2xl leading-none ${arColor}`}>
          مسجد عمر
        </span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark tone={tone} className="h-11 w-auto shrink-0" />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.35rem] font-medium tracking-tight ${textColor}`}>Masjid Omar</span>
        <span lang="ar" dir="rtl" className={`mt-1 self-start text-[1.05rem] ${arColor}`}>
          مسجد عمر
        </span>
      </span>
    </span>
  );
}
