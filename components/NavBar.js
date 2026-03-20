// components/NavBar.js

import Link from 'next/link';
import { useState } from 'react';

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/',                      label: 'Home' },
    { href: '/player',                label: 'Players' },
    { href: '/finder',                label: 'Player Finder' },
    { href: '/blogs',                 label: 'Blogs' },
    { href: '/portfolio',             label: "Brian's Portfolio" },
    { href: '/simulator',             label: 'CBB Simulator' },
    { href: '/dailymatchupviz',       label: 'Daily MatchupViz' },
    { href: '/heliocentric-leaderboard', label: 'Heliocentric Leaderboard' },
    { href: '/bracket',               label: 'Bracket' },
  ];

  return (
    <nav className="bg-gray-100 p-4">
      {/* Desktop */}
      <div className="hidden md:flex justify-between items-center">
        <div className="flex gap-6 items-center text-lg font-medium">
          {links.map(l => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/search" className="text-blue-600 font-medium hover:underline text-lg">
            Search
          </Link>
          <Link href="/">
            <img src="/CourtVizLogo.png" alt="CourtViz Logo" className="h-16 w-auto" />
          </Link>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden justify-between items-center">
        <Link href="/">
          <img src="/CourtVizLogo.png" alt="CourtViz Logo" className="h-12 w-auto" />
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-700 focus:outline-none"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden mt-4 flex flex-col gap-4 text-lg font-medium">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/search" className="text-blue-600 font-medium hover:underline" onClick={() => setOpen(false)}>
            Search
          </Link>
        </div>
      )}
    </nav>
  );
}