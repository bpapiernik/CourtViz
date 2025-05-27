import Link from 'next/link';

export default function Portfolio() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Brian&apos;s Portfolio</h1>
      <p className="mt-4 mb-8 text-center text-gray-600">
        A showcase of my sports analytics projects, models, and visualizations.
      </p>

      <div className="space-y-6">
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

        {/* Add more project cards here */}
        {/* Example: 
        <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">
            <Link href="/portfolio/heliocentric-shot-selection" className="text-blue-600 hover:underline">
              Smart Shot Selection via Heliocentric Modeling
            </Link>
          </h2>
          <p className="text-gray-700">
            Analyzing missed opportunities in NBA playmaking with expected points models and tracking data.
          </p>
        </div> 
        */}
      </div>
    </div>
  );
}

