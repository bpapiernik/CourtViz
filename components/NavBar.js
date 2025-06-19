// components/NavBar.js

import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="bg-gray-100 p-4 flex justify-between items-center">
      <div className="flex gap-6 items-center text-lg font-medium">
        <Link href="/">Home</Link>
        <Link href="/player">Players</Link>
        <Link href="/finder">Player Finder</Link>
        <Link href="/fieldviz">FieldViz</Link>
        <Link href="/blogs">Blogs</Link>
        <Link href="/portfolio">Brian&apos;s Portfolio</Link>
        <Link href="/simulator" className="ml-4 text-sm font-medium text-gray-600 hover:text-black"> CBB Simulator</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/search" className="text-blue-600 font-medium hover:underline text-lg">
          Search
        </Link>
        <Link href="/">
          <img src="/CourtVizLogo.png" alt="CourtViz Logo" className="h-16 w-auto" />
        </Link>
      </div>
    </nav>
  );
}
