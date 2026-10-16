export const metadata = { title: "Service unavailable", robots: { index: false } };

export default function SetupRequired() {
  return (
    <div className="container-page max-w-xl py-16 text-center">
      <h1 className="font-display text-3xl text-pine">Sign-in is not available</h1>
      <p className="mt-3 text-muted">The data service for this site is not configured, so accounts and protected areas are closed. Public information remains available.</p>
    </div>
  );
}
