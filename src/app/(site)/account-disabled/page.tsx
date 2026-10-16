export const metadata = { title: "Account disabled", robots: { index: false } };

export default function AccountDisabled() {
  return (
    <div className="container-page max-w-xl py-16 text-center">
      <h1 className="font-display text-3xl text-pine">This account is disabled</h1>
      <p className="mt-3 text-muted">Please speak with the masjid office if you think this is a mistake.</p>
    </div>
  );
}
