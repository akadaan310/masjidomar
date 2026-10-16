# Asset manifest

Originals from the supplied package are preserved byte-for-byte in `assets/` (and the original manifest in
`docs/source-package/ASSET_MANIFEST.original.md`).

## `assets/reference/` — user-supplied screenshots (INTERNAL ONLY)
| File | Contents | Published? |
| --- | --- | --- |
| exterior-day.jpg | Screenshot of a third-party daytime exterior photo (glass entrance, green/white sign) | No — rights pending |
| exterior-night.jpg | Screenshot of a third-party night exterior photo | No — rights pending |
| prayer-hall-blue-rug.jpg | Screenshot of interior, blue carpet, wooden mihrab/minbar | No — rights pending |
| prayer-hall-green-rug.jpg | Screenshot of interior, green carpet | No — rights pending |
| facebook-business-details.jpg | Facebook listing UI with address/phone | Never (third-party UI) |

## `assets/editorial/` — AI-assisted concept art
| File | Use | Published? |
| --- | --- | --- |
| masjid-omar-concept-exterior-sunset.{png,webp} | Home hero in concept mode; copied to `public/images/concept/` | Concept mode only, always captioned as AI-assisted; `media_assets.ai_generated = true`, `rights_cleared = false` |
| masjid-omar-concept-prayer-hall.{png,webp} | Home story section, visit gallery | Same |
| masjid-omar-logo-concept.png | Direction reference only (raster wordmark not used) | No |
| masjid-omar-visual-board.png | Direction reference only | No |

Note: the AI exterior shows details (ramp, accessible-parking sign, porch styling) that may not match the real
building. No accessibility claim is made from it.

## `assets/brand/` (supplied) and `public/brand/` (produced here)
| File | Notes |
| --- | --- |
| assets/brand/masjid-omar-mark-proposal.svg, masjid-omar-lockup-preview.svg | Supplied concept, kept as reference |
| public/brand/masjid-omar-mark.svg | **Proposed** mark: pointed arch framing the real gabled porch, glass-lit door and sidelights, small crescent |
| public/brand/masjid-omar-mark-mono.svg / -mark-reverse.svg | Monochrome and dark-background variants |
| public/brand/masjid-omar-lockup-horizontal.svg / -reverse.svg / -stacked.svg | Lockups with **live text** (Fraunces + Noto Naskh Arabic), `xml:lang="ar"` |
| src/app/icon.svg | Favicon |
| src/components/brand/Logo.tsx | React mark + horizontal/stacked/icon variants; colour, mono and reverse tones |

All brand files are drafts pending masjid approval.

## Screenshots
`docs/screenshots/*.png` — review matrix (7 routes × 390/768/1440, display at 1920×1080 and 3840×2160);
`docs/screenshots/workflow/*.png` — before/after evidence of the admin → public → member → imam flow.
These contain only demo accounts and sample content.
