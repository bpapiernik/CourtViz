import Image from 'next/image';

export default function Home() {
  return (
    <main className="p-6 max-w-3xl mx-auto space-y-10">
      {/* Logo */}
      <div className="flex justify-center">
        <img src="/CourtVizLogo.png" alt="CourtViz Logo" className="h-32 w-auto" />
      </div>

      {/* Site Title */}
      <section>
        <h1 className="text-3xl font-bold mb-2 flex items-center">🏀 <span className="ml-2">CourtViz</span></h1>
        <p className="text-xl leading-relaxed">
          Welcome to my full-stack sports analytics site. Built with <strong>Next.js</strong>, <strong>Supabase</strong>, and <strong>Fly.io</strong>.
        </p>
      </section>

      {/* About CourtViz */}
      <section>
        <h2 className="text-2xl font-semibold mb-1">📊 About CourtViz</h2>
        <p className="text-lg leading-relaxed">
          CourtViz was created as a sports analytics project to deliver powerful insights across all levels of sports and competition.
          The first step in building this platform was launching a full-stack website to showcase my ability to own the entire analytics pipeline — from back-end data collection and storage to front-end interactive visuals.
        </p>
        <p className="text-lg leading-relaxed mt-2">
          This site highlights features like dynamic player dashboards and a Player Finder tool that helps identify undervalued players,
          as well as uncover potential strengths and weaknesses based on data-driven metrics. As CourtViz continues to grow,
          the vision is to expand its scope across multiple sports while refining tools that support performance analysis, roster construction, and scouting.
        </p>
      </section>

      {/* About Me */}
      <section>
        <h2 className="text-2xl font-semibold mb-1">👋 About Me</h2>
        <div className="flex flex-col md:flex-row gap-6 items-center mt-4">
          <img src="/BP.png" alt="Brian Papiernik" className="h-40 w-40 rounded-full border object-cover" />
          <p className="text-lg leading-relaxed">
            My names is Brian Papiernik — a sports data scientist with experience across baseball, basketball, and multi-sport performance analysis.
            I’ve worked as a Baseball Technology Operator for the Tampa Bay Rays, a Baseball Student Manager with Notre Dame Baseball, and hold a Master’s degree in Sports Analytics from Notre Dame.
            I specialize in building end-to-end analytics pipelines, predictive models, and interactive tools for evaluating players and strategies.
            CourtViz is where I bring together my passion for sports, data, and clean design.
          </p>
        </div>
      </section>

      {/* Former Projects */}
      <section>
        <h2 className="text-2xl font-semibold mb-1">🛠 Former Portfolio Projects</h2>
        <ul className="list-disc list-inside text-lg leading-relaxed space-y-2">
          <li>
            <strong>March Madness Simulation Model</strong> — Predicted tournament outcomes using ShotQuality, Torvik, and Elo-based features.
          </li>
          <li>
            <strong>MLB Pitch Clustering Project</strong> — Used k-means to group pitch shapes and identify optimal pitch sequencing strategies.
          </li>
          <li>
            <strong>NBA Injury Prevention Model</strong> — Leveraged tracking data and play context to detect movement patterns that increase injury risk.
          </li>
          <li>
            <strong>College Basketball Game Outcome Probabilities</strong> — Modeled game win probabilities using Torvik and ShotQuality metrics, while accounting for transfer portal impact and team-level volatility.
          </li>
          <li>
            <strong>Heliocentric Snapshot Model</strong> — Evaluated offensive decision-making and shot distribution by comparing missed shot outcomes with catch-and-shoot opportunities for teammates based on tracking data.
          </li>
        </ul>

        <p className="text-sm text-gray-600 italic mt-4">
          🔗 A full project archive and downloadable resume will be added here soon.
        </p>
      </section>
    </main>
  );
}
