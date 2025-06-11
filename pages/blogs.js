import Link from "next/link";

export default function Blogs() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Blogs</h1>
      <p className="text-gray-600 mb-6">
        Stay tuned for breakdowns and insights. Here’s the latest post:
      </p>

      <div className="border p-4 rounded-lg hover:shadow transition">
        <Link href="/blogs/patrick-williams" passHref>
          <a className="block">
            <h2 className="text-2xl font-semibold mb-1">
              Is There Still Hope for Patrick Williams?
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Brian Papiernik • June 2025
            </p>
            <p className="text-gray-700">
              A deep dive into Williams&apos; offensive regression, defensive flashes,
              and whether he can still develop into a modern NBA role player.
            </p>
          </a>
        </Link>
      </div>
      <div className="border p-4 rounded-lg hover:shadow transition">
        <Link href="/blogs/brice-sensabaugh" passHref>
          <a className="block">
            <h2 className="text-2xl font-semibold mb-1">
              Brice Sensabaugh: Hidden Gem?
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Brian Papiernik • June 2025
            </p>
            <p className="text-gray-700">
              An under-the-radar look at Sensabaugh&apos;s elite shooting, short-roll
              efficiency, and where he still has room to grow on defense.
            </p>
          </a>
        </Link>
      </div>
    </div>
  );
}
