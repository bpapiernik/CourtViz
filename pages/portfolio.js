import Link from 'next/link';

export default function Portfolio() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Brian&apos;s Portfolio</h1>
      <p className="mt-4 mb-8 text-center text-gray-600">
        A showcase of my sports analytics projects, models, and visualizations.
      </p>

      <div className="space-y-6">
        {/* Heliocentric Project */}
        <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">
            <Link href="/portfolio/heliocentric" className="text-blue-600 hover:underline">
              Heliocentric Shot Decision-Making Model
            </Link>
          </h2>
          <p className="text-gray-700">
            Quantifying shot selection and passing decisions using expected points (EP) across every offensive player on the court. Built with XGBoost and NBA tracking data to power player evaluation, coaching feedback, and playmaking insights.
          </p>
        </div>

        {/* March Madness Project */}
        <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">
            <Link href="/portfolio/march-madness-prediction" className="text-blue-600 hover:underline">
              March Madness: Predicting NCAA Game Outcomes
            </Link>
          </h2>
          <p className="text-gray-700">
            Forecasting college basketball matchups using XGBoost, ShotQuality metrics, Torvik efficiency, and EvanMiya player ratings.
          </p>
        </div>

        {/* NBA Injury Prevention Project */}
        <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">
            <Link href="/portfolio/injury-prevention" className="text-blue-600 hover:underline">
              NBA Player Tracking Injury Prevention Project
            </Link>
          </h2>
          <p className="text-gray-700">
            Modeling injury risk using SportVU player tracking data and play-by-play usage patterns. Applied XGBoost and Logistic Regression with SHAP analysis to recommend load management strategies.
          </p>
        </div>
      </div>
    </div>
  );
}
