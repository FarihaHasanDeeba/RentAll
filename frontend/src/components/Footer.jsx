export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black">
      <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-neutral-400">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            &copy; {year} Rent<span className="text-emerald-400">All</span> &middot; Hyperlocal Tool
            &amp; Equipment Sharing Economy
          </span>
          <span>Built with React, Express &amp; MongoDB</span>
        </div>
        <p className="mt-2 text-neutral-500">
          Payments run through a simulated SSLCommerz gateway for demo purposes — no real charges
          occur.
        </p>
      </div>
    </footer>
  );
}
