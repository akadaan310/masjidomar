import { ImageResponse } from "next/og";

export const alt = "Masjid Omar, Tampa — prayer times, programs and a private Ask-the-Imam desk";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Text-only card (no photography) so it is safe to share before images are approved.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#102E28", color: "#F8F6F0" }}>
        <div style={{ fontSize: 28, letterSpacing: 6, color: "#B8C7B5", textTransform: "uppercase" }}>Tampa, Florida</div>
        <div style={{ fontSize: 112, fontWeight: 600, marginTop: 16 }}>Masjid Omar</div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#C3A66F" }}>A home for worship. A heart for community.</div>
      </div>
    ),
    size,
  );
}
