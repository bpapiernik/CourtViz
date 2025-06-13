import Link from "next/link";

export default function Blogs() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Blogs</h1>
      <p className="text-gray-600 mb-6">
        Stay tuned for breakdowns and insights. Here’s the latest post:
      </p>

      {/* Patrick Williams Blog Post */}
      <div className="border p-4 rounded-lg hover:shadow transition mb-4">
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

      {/* Brice Sensabaugh Blog Post */}
      <div className="border p-4 rounded-lg hover:shadow transition mb-4">
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

      {/* Xaivian Lee Blog Post */}
      <div className="border p-4 rounded-lg hover:shadow transition mb-4">
        <Link href="/blogs/xaivian-lee-florida" passHref>
          <a className="block">
            <h2 className="text-2xl font-semibold mb-1">
              Previewing Xaivian Lee at Florida: From Ivy League to SEC Initiator
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Brian Papiernik • June 2025
            </p>
            <p className="text-gray-700">
              A breakdown of how Xaivian Lee’s pick-and-roll creation, rim pressure, and
              transition play can reshape Florida’s offense after Walter Clayton’s departure.
            </p>
          </a>
        </Link>
      </div>

      {/* Naithan George Blog Post */}
      <div className="border p-4 rounded-lg hover:shadow transition">
        <Link href="/blogs/naithan-george" passHref>
          <a className="block">
            <h2 className="text-2xl font-semibold mb-1">
              The Quiet Catalyst: Naithan George’s Fit at Syracuse
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Brian Papiernik • June 2025
            </p>
            <p className="text-gray-700">
              How Georgia Tech transfer Naithan George can unlock Syracuse’s offense with his poise,
              vision, and ability to organize a talented but previously disjointed roster.
            </p>
          </a>
        </Link>
      </div>
    </div>
  );
}
