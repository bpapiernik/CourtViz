// components/NavBar.js
 
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
 
export default function NavBar() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
 
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
 
  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [router.pathname]);
 
  const links = [
    { href: '/',                         label: 'Home' },
    { href: '/player',                   label: 'Players' },
    { href: '/finder',                   label: 'Player Finder' },
    { href: '/blogs',                    label: 'Blogs' },
    { href: '/portfolio',                label: "Brian's Portfolio" },
    { href: '/simulator',                label: 'CBB Simulator' },
    { href: '/dailymatchupviz',          label: 'Daily MatchupViz' },
    { href: '/heliocentric-leaderboard', label: 'Heliocentric Leaderboard' },
    { href: '/bracket',                  label: 'Bracket' },
  ];
 
  const isActive = (href) => {
    if (href === '/') return router.pathname === '/';
    return router.pathname.startsWith(href);
  };
 
  return (
    <>
      <style>{`
        .nav-link {
          position: relative;
          text-decoration: none;
          color: var(--foreground);
          font-size: 14px;
          font-weight: 500;
          opacity: 0.65;
          transition: opacity 0.15s;
          white-space: nowrap;
          padding-bottom: 2px;
        }
        .nav-link:hover { opacity: 1; }
        .nav-link.active {
          opacity: 1;
          font-weight: 700;
          background: color-mix(in srgb, var(--foreground) 8%, transparent);
          border-radius: 6px;
          padding: 3px 8px;
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 8px;
          right: 8px;
          height: 2px;
          background: var(--foreground);
          border-radius: 99px;
        }
        .mobile-link {
          text-decoration: none;
          color: var(--foreground);
          font-size: 15px;
          font-weight: 500;
          opacity: 0.7;
          padding: 8px 0;
          border-bottom: 1px solid color-mix(in srgb, var(--foreground) 8%, transparent);
          transition: opacity 0.15s;
        }
        .mobile-link:hover { opacity: 1; }
        .mobile-link.active { opacity: 1; font-weight: 700; }
        .hamburger-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--foreground);
          padding: 4px;
          opacity: 0.7;
          transition: opacity 0.15s;
        }
        .hamburger-btn:hover { opacity: 1; }
        .logo-img:hover { transform: scale(1.08); }
      `}</style>
 
      <nav style={{
        background: 'var(--navbar)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'box-shadow 0.2s, backdrop-filter 0.2s',
        boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.08)' : 'none',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
 
          {/* ── Desktop ─────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 56,
            gap: 8,
          }}
            className="desktop-nav"
          >
            {/* Links */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', overflow: 'hidden' }}>
              {links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`nav-link${isActive(l.href) ? ' active' : ''}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
 
            {/* Right side: Search + Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <Link
                href="/search"
                className={`nav-link${isActive('/search') ? ' active' : ''}`}
              >
                🔍 Search
              </Link>
              <Link href="/" style={{ display: 'flex', alignItems: 'center' }} className="logo-link">
                <Image src="/CourtVizLogo.png" alt="CourtViz" width={52} height={52} style={{ objectFit: 'contain', transition: 'transform 0.2s ease' }} className="logo-img" />
              </Link>
            </div>
          </div>
 
          {/* ── Mobile ──────────────────────────────────────────────────── */}
          <div style={{
            display: 'none',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 52,
          }}
            className="mobile-nav"
          >
            <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <Image src="/CourtVizLogo.png" alt="CourtViz" width={40} height={40} style={{ objectFit: 'contain' }} />
            </Link>
            <button
              className="hamburger-btn"
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {open ? (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
 
        </div>
 
        {/* Mobile dropdown */}
        {open && (
          <div style={{
            borderTop: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)',
            padding: '8px 20px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {[...links, { href: '/search', label: 'Search' }].map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`mobile-link${isActive(l.href) ? ' active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
 
      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav  { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav  { display: none !important; }
        }
      `}</style>
    </>
  );
}
 