import Image from "next/image";

/** Image with a visible provenance caption. AI concept art is always labelled as such. */
export function DisclosedImage({
  src,
  alt,
  credit,
  aiGenerated,
  priority = false,
  className = "",
  sizes = "100vw",
  captionClassName = "",
  hideCaption = false,
}: {
  src: string;
  alt: string;
  credit: string;
  aiGenerated: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  captionClassName?: string;
  hideCaption?: boolean;
}) {
  return (
    <figure className={`overflow-hidden ${/\babsolute\b/.test(className) ? "" : "relative"} ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={priority ? 55 : 75} className="object-cover" />
      {!hideCaption && (
      <figcaption
        className={`absolute bottom-2 end-2 max-w-[90%] rounded-full bg-pine/80 px-3 py-1 text-[0.72rem] font-semibold text-ivory backdrop-blur ${captionClassName}`}
      >
        {aiGenerated ? "Concept visualization (AI-assisted) — not a photograph of Masjid Omar" : credit}
      </figcaption>
      )}
    </figure>
  );
}
