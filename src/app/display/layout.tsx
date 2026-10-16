export const metadata = { title: "Masjid screen", robots: { index: false, follow: false } };

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return <main id="main">{children}</main>;
}
