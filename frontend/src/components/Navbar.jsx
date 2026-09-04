import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Rentals' },
  { to: '/mailbox', label: 'Mailbox' },
  { to: '/reminders', label: 'Reminders' },
  { to: '/admin', label: 'Admin' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <header className="bg-black">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold text-white">
            Rent<span className="text-emerald-400">All</span>
          </Link>
          <nav className="flex items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium ${
                  isActive(link.to) ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-neutral-300">
          Payment Operations &amp; Reminders
        </span>
      </div>
    </header>
  );
}
