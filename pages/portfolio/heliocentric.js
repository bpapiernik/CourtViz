import Image from "next/image";
import Head from "next/head";

export default function HeliocentricModel() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Head>
        <title>NBA Heliocentric Decision-Making Model</title>
      </Head>

      <h1 className="text-3xl font-bold mb-2">
        Evaluating Shot Selection in Heliocentric Offenses through Opportunity Cost
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Brian Papiernik • April 2025
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Introduction</h2>
      <p className="mb-4">
        This project introduces a Smart Decision-Making Model designed to evaluate offensive shot selection in the NBA by quantifying the opportunity cost of each shot attempt. The goal is to understand whether the player who took the shot was actually the best option on the floor, or if there was a better opportunity available that went unused.
      </p>
      <p className="mb-4">
        The core of the model is an <strong>expected points (EP)</strong> estimator trained on over 100,000 historical NBA shots using XGBoost. The model was trained using three key spatial features:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Shot location on the court</li>
        <li>Distance from the basket</li>
        <li>Closest defender proximity</li>
      </ul>
      <p className="mb-4">
        These inputs allow the model to estimate the expected value of a shot attempt based on a snapshot of court spacing at the moment the shot is taken.
      </p>
      
      <p className="mb-4">
        To evaluate shot selection, the model captures that same snapshot for all five offensive players on the floor. For the shooter, this represents the value of the shot they took. For the remaining four teammates, we estimate what their expected points would have been if the ball had been passed to them, incorporating adjustments for pass time and defensive closeout pressure. These adjustments allow us to simulate realistic alternatives and assess decision-making beyond just the shot outcome.
      </p>

      <p className="mb-4">
        These values form the foundation of a <strong>Heliocentric Leaderboard</strong>,  which tracks the opportunity cost and creation value of shot decisions across thousands of possessions. Specifically, we created three teammate-based metrics to contextualize the shooter&apos;s shot selection decision:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Max Teammate EP</strong> – the best available passing option</li>
        <li><strong>Average Teammate EP</strong> – the overall shot quality among teammates</li>
        <li><strong>Average of Top 2 Teammate EPs</strong> – captures plays with multiple viable alternatives</li>
      </ul>
      
      <p className="mb-4">
        The model looks at how much value might have been left on the table by comparing the shooter&apos;s expected points (EP) to what their teammates could have produced if they got the ball instead. This helps us spot missed passing opportunities and shows where better decisions could have led to more efficient offense.
      </p>

      <p className="mb-4">
        Importantly, the model also recognizes creation value — situations where the shooter&apos;s gravity drew extra defenders and opened high-value opportunities for teammates, even if the ball didn&apos;t move. This provides a fuller picture of heliocentric players who generate team value by manipulating defenses, regardless of whether it results in an assist or shot.
      </p>

      <p className="mb-4">
        While the model is built on NBA data and dimensions, it can be adapted to college basketball too. As long as we have the same spatial information — like shot location, distance from the basket, and how close defenders are, or full player tracking at the time of the shot — the model can still work. With a few adjustments for court size and spacing, this model can help coaches, analysts, and front offices across all levels better understand the balance between shot creation, decision-making, and offensive efficiency.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Motivation</h2>
      <p className="mb-4">
        In today&apos;s NBA, many teams rely on heliocentric offenses. These systems are built around one primary creator who dictates most of the team&apos;s shot decisions. These players often carry huge offensive loads that not only take a large share of the team&apos;s shots but also create opportunities for everyone else. While traditional stats like usage rate and assist percentage give us some sense of how involved these players are, they don’t fully capture the quality of the decisions being made.
      </p>
      <p className="mb-4">
        Not every shot is a good shot, and not every pass actually leads to something better. What&apos;s missing in most metrics is a way to measure the opportunity cost — how many points the team may have left on the table because the star took a tough shot instead of finding an open teammate in a better spot.
      </p>
      <p className="mb-4">
        That question gets even more interesting when you think about it through the lens of the Weak Link Theory. Basketball is generally considered a “strong link” sport — meaning it&apos;s often your best players, not your worst, who determine the outcome. But even the best players can hurt your offense if they consistently force shots instead of trusting teammates. If a heliocentric player is ignoring high-quality options, it might be dragging down the overall efficiency of the team — even if their individual numbers look fine.
      </p>
      <p className="mb-4">
        This project was built to address that gap. The goal is to evaluate shot decisions in context — not just in terms of whether the shot went in, but whether it was the right decision given the state of the court. Using player tracking data, we estimate expected points (EP) for every offensive player at the moment a shot is taken, and compare the shooter&apos;s value to the best available alternative. This allows us to quantify missed opportunities, suboptimal decision-making, and situations where the shooter actually made the best possible choice.
      </p>
      <p className="mb-4">
        At the same time, the model also recognizes off-ball creation — when a player bends the defense, draws help, or shifts defenders in a way that opens up scoring chances for others. These subtle forms of gravity are a big part of what makes heliocentric stars valuable, even if they don&apos;t always result in assists or direct involvement in the play.
      </p>
      <p className="mb-4">
        By combining spatial data with a shot value model, this framework gives us a better way to understand decision-making — not just who&apos;s taking the shots, but whether they&apos;re making the most of each possession. It&apos;s a tool that can help coaches, analysts, and front offices get a clearer picture of how players are running the offense — and how much better it could be.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Problem</h2>
      <p className="mb-4">
        While heliocentric players drive much of today&apos;s NBA offense, there hasn&apos;t been a reliable way to evaluate whether their decisions — especially shot attempts — are truly optimal. Traditional metrics don&apos;t tell us how often a player chooses a tough shot over a better alternative, or how much team value is lost when high-usage players overlook open teammates. Without a framework to assess the opportunity cost of these choices, teams risk overvaluing inefficient creation. This project aims to fill that gap by quantifying the difference between the shot a player took and the best available shot on the floor — offering a clearer picture of decision-making, creation value, and missed opportunities.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Variables of Interest</h2>
      <p className="mb-4">
        This model evaluates heliocentric shot selection using spatial, contextual, and modeled variables from NBA tracking data — helping us understand not just what happened, but what could have happened.
      </p>
      <h3 className="text-lg font-semibold mt-4 mb-2">Core Spatial Inputs (used to train the Expected Points model):</h3>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Shot Location (x, y):</strong> What location the shot occurred on the court</li>
        <li><strong>Distance from Basket</strong></li>
        <li><strong>Closest Defender Distance:</strong> Space between the shooter and their nearest defender</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4 mb-2">Snapshot Decision Context (at time of shot):</h3>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Shooter Expected Points</strong></li>
        <li><strong>Teammate Expected Points:</strong> Based on their location and defender proximity</li>
        <li><strong>Adjusted Teammate Expected Points:</strong> Factoring pass time + closeout pressure</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4 mb-2">Key Derived Metrics:</h3>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Max Teammate Expected Points:</strong> Highest-scoring opportunity available if the shooter passed</li>
        <li><strong>Average Teammate Expected Points:</strong> Mean EP of all 4 teammates</li>
        <li><strong>Top-2 Teammate Expected Points Avg</strong></li>
        <li><strong>Opportunity Cost:</strong> Shooter EP – best available alternative</li>
        <li><strong>Creation Value:</strong> Teammate looks created through the shooter&apos;s gravity</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Problem Framing</h2>
      <p className="mb-4">
        The goal of this project is to better understand shot selection and decision-making in heliocentric offensive systems — where one player dominates the ball and dictates much of a team&apos;s shot creation. While traditional stats like usage rate and assist percentage tell us how involved a player is, they don&apos;t capture the value or opportunity cost of the decisions they&apos;re making in real time.
      </p>
      <p className="mb-4">
        This model looks to answer a simple but important question: was the shot the player took actually the best option on the floor? By using tracking data, we can evaluate the decision in real time — comparing the value of the shot taken to what could&apos;ve happened if the ball had gone to someone else. It also ties into the idea behind the Weak Link Theory. Even in a sport like basketball where your best players usually matter most, over-relying on one guy to make every decision can backfire if they&apos;re missing better options. By highlighting those missed chances, this project gives us a clearer way to see how shot selection and trust in teammates impact overall offensive flow and efficiency.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Proposed Solution</h2>
      <p className="mb-4">
        To address this problem, I built an Expected Points (EP) model using XGBoost, trained on over 100,000 NBA shots. The model estimates the value of a shot based on three spatial features: shot location, distance from the basket, and proximity to the closest defender.
      </p>
      <p className="mb-4">
        To capture different ways defenders impact shot quality, I actually built two versions of the model. One treats defender distance as a continuous variable, while the other breaks it into categorical ranges (e.g., 0–2 feet, 2–4 feet, etc.) to better account for behavioral thresholds in defensive pressure. This gives us flexibility in how we interpret spacing and contest levels across different types of offensive possessions.
      </p>
      <p className="mb-4">
        At the moment of a shot, the model applies these learned relationships not only to the shooter, but also to each of the four teammates on the floor. For every offensive player, we extract the necessary features from the court snapshot — including their position, their defender&apos;s proximity, and their distance from the hoop — and use the model to estimate each player&apos;s expected points if they were to take the shot instead.
      </p>
      <p className="mb-4">
        We then go a step further by adjusting teammate EP values based on estimated pass time and defensive closeout windows, allowing us to more realistically estimate what would have happened had the shooter passed the ball.
      </p>
      <p className="mb-4">
        From there, we calculate several decision-making metrics — including opportunity cost (shooter EP vs. max teammate EP), average teammate EP, and the average of the top two options — to give a more nuanced picture of shot quality in context. We also track creation value: rewarding players who shift the defense and create high-EP opportunities for others, even if they don&apos;t get an assist.
      </p>
      <p className="mb-4">
        The result is a spatially grounded, decision-aware framework that helps identify which high-usage players elevate their team — and which ones might be leaving points on the table.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Data Description</h2>
      <p className="mb-4">
        This project relies on two main datasets: a cleaned set of ~100,000 historical NBA shots used to train an Expected Points (EP) model, and a frame-level tracking dataset aligned with play-by-play data to apply that model in real shot contexts. Together, they allow us to evaluate whether a player&apos;s shot was the most efficient option available — and to calculate the opportunity cost of that decision. The training dataset provides the foundation for learning how shot value changes based on spatial and contextual variables. The application dataset builds on that by reconstructing every live shot event from tracking data, giving us a full view of all 10 players on the floor when each decision was made.
      </p>
      <p className="mb-4">
        All data processing, feature engineering, and modeling were completed in R, with custom logic used to extract player positioning, defensive proximity, and outcome context at the moment of each shot.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Data Sources</h2>
      <h3 className="text-lg font-semibold mt-4 mb-2">Training Dataset (Expected Points Model)</h3>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Key Columns:</strong> shot_distance, x, y, defender_distance, shot_made_flag, shot_type, action_type, touch_time, dribbles, period, shot_clock</li>
      </ul>
      <p className="mb-4">
        This dataset includes over 100,000 shots from official NBA game logs, including spatial and contextual features used to train the EP model. The three variables used for model training were:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Shot Distance</strong></li>
        <li><strong>X, Y Coordinates</strong> (for court zone context)</li>
        <li><strong>Closest Defender Distance</strong></li>
      </ul>
      <p className="mb-4">
        Two XGBoost models were trained:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>A <strong>continuous model</strong>, treating defender distance as a numeric feature</li>
        <li>A <strong>categorical model</strong>, with distance bins (e.g., 0–2, 2–4, 4–6 feet) to better reflect defensive pressure thresholds</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4 mb-2">Application Dataset (Tracking Data Linked to PBP)</h3>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Key Columns:</strong> game_id, event_id, ent, team, x, y, closest_defender, closest_distance, distance_from_hoop, predicted_ep, predicted_cat_ep, took_shot, make_or_miss</li>
      </ul>
      <p className="mb-4">
        This dataset combines NBA player tracking data with play-by-play (PBP) logs to identify the positioning of all 10 players on the court at the exact moment of a shot attempt. For each made or missed shot, the model was applied to:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>The shooter</li>
        <li>The four other offensive players (teammates)</li>
        <li>All five defenders (for defensive context and spatial pressure estimation)</li>
      </ul>
      <p className="mb-4">
        Using the x and y coordinates of each player and their matchup proximity, the model generates expected points (EP) values for every offensive player involved in the possession. Closest defender distance is derived for each player, allowing for both continuous and categorical EP model predictions.
      </p>
      <p className="mb-4">
        Including defenders not only provides accurate EP estimates but also allows for future extensions of the model to analyze team-level defensive coverage, help defense gravity, and contest recovery windows in greater depth.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Derived Variables</h2>
      <p className="mb-4">
        From the predictions made by the EP model, the following decision-based metrics are created:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Shooter EP:</strong> The expected points value of the actual shot taken</li>
        <li><strong>Max Teammate EP:</strong> The highest expected points value among the other four teammates</li>
        <li><strong>Average Teammate EP:</strong> The mean of the four teammates&apos; EP values</li>
        <li><strong>Top-2 Teammate EP Avg:</strong> Average EP of the two best-positioned teammates</li>
        <li><strong>Opportunity Cost:</strong> Difference between the shooter&apos;s EP and the highest available teammate EP</li>
        <li><strong>Creation Value:</strong> High-value scoring opportunities created due to the shooter&apos;s gravity (e.g., help defense or rotations that open up teammates), regardless of whether a pass was made</li>
      </ul>
      <p className="mb-4">
        These metrics help evaluate whether the shooter made the optimal decision, and whether their presence improved the offense — even without a pass or assist.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Data Split</h2>
      <p className="mb-4">
        To train and evaluate the model fairly, the dataset was split into a training set (80%) and a test set (20%) using stratified sampling based on the “points” variable. This approach helps maintain the distribution of scoring across both sets in order to ensure the model is exposed to a range of offensive performance during training that can be evaluated fairly on unseen data.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Methods</h2>
      <p className="mb-4">
        To model shot quality and decision-making in heliocentric offenses, I used XGBoost — a machine learning technique that builds decision trees one after another, each one learning from the mistakes of the previous. It&apos;s a great fit for this kind of project because it handles messy, complex data really well and highlights which variables matter most.
      </p>
      <p className="mb-4">
        I trained two versions of the expected points (EP) model using over 100,000 historical NBA shots. One version treated defender distance as a continuous variable, while the other binned it into ranges like 0–2 feet, 2–4 feet, and so on, to better reflect how defenders actually pressure shooters. Both models relied on a few key features: shot distance, x/y location on the court, and the defender&apos;s proximity.
      </p>
      <p className="mb-4">
        Once the models were trained, I applied them to tracking data linked with play-by-play logs. This let me evaluate not just the shooter, but every offensive player on the court at the moment of the shot. The model gives an EP value for each player based on their location and defender distance, allowing me to compare what actually happened with what could&apos;ve happened if the shooter passed instead.
      </p>
      <p className="mb-4">
        XGBoost worked well here because it&apos;s flexible, performs well on big datasets, and gives a clear picture of which variables are doing the heavy lifting — all of which helped me better understand how shot decisions shape offensive efficiency in heliocentric systems.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Results</h2>
      <p className="mb-4">
        The Heliocentric Decision-Making model offered a sharper lens into how NBA players navigate offensive decisions — and just how often they pass up better ones. By comparing the expected points (EP) of the shooter to the expected outcomes of their teammates at the time of the shot, we were able to turn subjective film reads into objective, possession-level insights.
      </p>
      <p className="mb-4">
        Across thousands of NBA possessions, we found:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Shooters made decisions that outperformed their average teammate&apos;s EP about 56% of the time.</li>
        <li>Against the top two teammate options, that dropped to 42%.</li>
        <li>When compared to the best available option, shooters made the ideal decision just 33% of the time.</li>
      </ul>
      <p className="mb-4">
        In other words, roughly two-thirds of the time, the player who shot could have passed to someone with a higher expected return.To make sense of this, we categorized decision-making into four tiers, adjusting the thresholds based on the context of comparison:
      </p>

      <div className="overflow-x-auto mb-4">
        <table className="table-auto border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Benchmark</th>
              <th className="border border-gray-300 px-4 py-2">Great Decision</th>
              <th className="border border-gray-300 px-4 py-2">Good Decision</th>
              <th className="border border-gray-300 px-4 py-2">Bad Decision</th>
              <th className="border border-gray-300 px-4 py-2">Terrible Decision</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Max Teammate EP (m_EP)</td>
              <td className="border border-gray-300 px-4 py-2">EP ≥ m_EP + 0.20</td>
              <td className="border border-gray-300 px-4 py-2">EP ≥ m_EP + 0.00</td>
              <td className="border border-gray-300 px-4 py-2">EP ≤ m_EP − 0.25</td>
              <td className="border border-gray-300 px-4 py-2">EP ≤ m_EP − 0.35</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Top-2 Teammates EP (2_EP)</td>
              <td className="border border-gray-300 px-4 py-2">EP ≥ 2_EP + 0.15</td>
              <td className="border border-gray-300 px-4 py-2">EP ≥ 2_EP + 0.05</td>
              <td className="border border-gray-300 px-4 py-2">EP ≤ 2_EP − 0.20</td>
              <td className="border border-gray-300 px-4 py-2">EP ≤ 2_EP − 0.30</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Average Teammate EP (A_EP)</td>
              <td className="border border-gray-300 px-4 py-2">EP ≥ A_EP + 0.15</td>
              <td className="border border-gray-300 px-4 py-2">EP ≥ A_EP + 0.00</td>
              <td className="border border-gray-300 px-4 py-2">EP ≤ A_EP − 0.20</td>
              <td className="border border-gray-300 px-4 py-2">EP ≤ A_EP − 0.30</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mb-4">
        These weren&apos;t arbitrary cutoffs — they were calibrated using the distribution of real EP values, ensuring each decision tier reflects a meaningful difference in shot quality. A “terrible” decision might mean a player forced a contested fadeaway while a teammate stood open in the corner. A “great” decision might reflect a smart relocation or self-created look that outperformed all available alternatives.
      </p>
      <p className="mb-4">
        We also introduced a <strong>Heliocentric Value Score</strong>, measuring the net difference between a player&apos;s shot and a given teammate benchmark (average, top-2, or max). This lets us rank players based on their decision-making efficiency, not just their raw output or usage rate.
      </p>
      <p className="mb-4">
        Depending on your lens:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li><strong>Max Teammate EP:</strong> Are they consistently missing elite reads?</li>
        <li><strong>Top-2 EP:</strong> Do they ignore multiple good options?</li>
        <li><strong>Average EP:</strong> Are they raising or dragging down team flow?</li>
      </ul>

      <p className="mb-4">
        To make the data even more actionable, we&apos;ve created <strong>interactive Heliocentric Leaderboards</strong> that let you sort players by context, usage, and decision quality across these benchmarks.
      </p>
      <p className="mb-4">
        What we found was a wide range of tendencies. Some players consistently add value by taking high-EP shots, leveraging spacing, or manipulating defenders to create their own look. Others routinely fire over better options, missing chances to optimize the possession.
      </p>
      <p className="mb-4">
        Whether you&apos;re a coach developing smarter habits, a front office evaluating fit and decision-making under pressure, or a scout looking for unselfish creators, this model gives you a new way to track not just who shoots — but how well they process the floor in real time.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Model Applications</h2>
      <p className="mb-4">
        The beauty of this model is how much you can get out of so little. With just three inputs — shot distance, court zone (based on x/y location), and closest defender distance — we can break down any offensive possession and estimate expected points (EP) for every offensive player on the floor, not just the one who took the shot.
      </p>

      <Image
        src="/images/ep_snapshot.png"
        alt="EP Snapshot"
        width={600}
        height={300}
        className="rounded shadow-md mb-6"
      />
      <p className="mb-4">
        As shown in the graphic above, each offensive player gets two EP values. The top number comes from the categorical model, which groups defender distance into ranges like “tight” or “open” to reflect how players feel a contest. The bottom number comes from the continuous model, which uses the exact defender distance to produce more detailed predictions. This two-model setup gives us flexibility. The categorical model is great for coaching and labeling behaviors — like tagging when a player takes a contested jumper. The continuous model is better suited for regression analysis or tracking small trends over time.
      </p>
      <p className="mb-4">
        With just player and defender locations, we can spot poor shot decisions by comparing the shooter&apos;s EP to their teammates&apos;, flag possessions where better options were missed, or even diagnose situations where nobody had a good look — which tells us it might be a play design issue, not just a player mistake. It also helps us measure gravity — how a player&apos;s movement or presence can create higher-value chances for others, even if they never touch the ball.
      </p>
      <p className="mb-4">
        One of the most useful parts? We don&apos;t need to know whether the shot actually went in. That means we can use this tool live or retroactively, and it scales easily — whether you&apos;re looking at NBA tracking data, Synergy clips from college, or even international leagues with basic player mapping.
      </p>
      <p className="mb-4">
        It also helps you measure gravity — identifying players who consistently create better scoring opportunities for teammates just by moving or spacing correctly, even if they don&apos;t end up in the box score.
      </p>
      <h3 className="text-xl font-semibold mt-6 mb-2">Player Development</h3>
      <p className="mb-4">
        This model can help players make smarter decisions, especially primary ball handlers. You can show them clips where they took tough shots while a teammate had a better look — backed by numbers, not just coach&apos;s intuition. It&apos;s also a great tool to reinforce ball movement by highlighting when high-EP teammates were open but ignored. On the flip side, it can show off-ball players the value they bring through cutting, spacing, or relocating into high-EP areas — giving them clearer development goals. And by comparing actual shot outcomes to predicted EP, coaches can identify players who are getting unlucky versus those who may be forcing low-value looks.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">Coaching & Game Planning</h3>
      <p className="mb-4">
        For coaches, this model becomes a playbook audit tool. You can use it postgame to pinpoint inefficient possessions — like when someone passed up an open three or forced a tough midrange. You can also evaluate how well your offensive sets create multiple good options, and where the breakdowns happen. On the defensive side, you can identify matchups where opponents are consistently getting good looks — even if the box score doesn&apos;t show it yet. This kind of insight adds depth to scouting reports and game prep.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">Front Office & Analytics</h3>
      <p className="mb-4">
        From a team-building perspective, the model adds context to high-usage players. Are they actually creating value, or just taking a lot of shots? It also helps spot undervalued players — guys who regularly get into high-EP areas but don&apos;t see the ball, which could point to untapped upside. It&apos;s a useful tool for lineup evaluation too — showing how different combinations change shot quality and spacing. Over time, you can even build player archetypes based on EP profiles — like “gravity shooters,” “connectors,” or “ball-stoppers” — which can help shape your roster strategy.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">Scouting & Opponent Preparation</h3>
      <p className="mb-4">
        For scouting, you can build EP-based shot maps to see who forces tough looks and who consistently passes up good ones. It also reveals defensive tendencies — like whether a team over-helps and leaves shooters open, or plays conservative and forces isolations. If you&apos;re preparing for a playoff series or evaluating a potential free agent, this gives you a deeper layer beyond highlights and counting stats.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">Why It Scales</h3>
      <p className="mb-4">
        What makes this so scalable is its simplicity. You don&apos;t need proprietary tracking data or years of historical stats. All you need is player and defender location, shot distance, and court zone. That opens the door to use it in a ton of settings — NBA teams with optical tracking, college programs with Synergy tagging, overseas teams combining video and player charts, even grassroots programs using AI video tools. Whether you&apos;re trying to build smarter scouting reports, train players to make better decisions, or evaluate how guys fit into your system, this model gives you a flexible, customizable lens into the decision-making process behind every possession.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Next Steps</h2>
      <p className="mb-4">
        Now that we&apos;ve built a solid foundation for evaluating offensive decisions, there&apos;s a lot of potential to expand this framework into other areas — especially on the defensive end, in scouting prep, and in how we think about playmaking.
      </p>
      <p className="mb-4">
        One natural next step is creating a <strong>Defensive Shot Quality Evaluation</strong>, or what you might call a “Luck Index.” The idea is simple: compare the expected points (EP) for each shot — based on location and contest — to what actually happened. If a team keeps allowing high-EP shots that are just missing, they&apos;re probably not defending as well as it looks. On the flip side, if opponents are hitting tough, low-EP shots, that could be bad luck or just elite shot-making. Either way, it gives us a better way to evaluate defensive performance without relying solely on whether the ball went in. It&apos;s especially useful for spotting teams that might be due for regression — or those that are quietly elite but getting unlucky.
      </p>
      <p className="mb-4">
        Another area to explore is <strong>Over-Help and Rotation Tendencies</strong>. With this model, we can track when defenders leave their man to provide help and what kind of looks that creates elsewhere. Are they giving up high-EP opportunities on the weak side? Are certain players drawing multiple defenders without even shooting? We can dig into that. It&apos;s a great way to spot which offensive actions trigger breakdowns — whether it&apos;s isolation drives, post touches, or ball screens — and which defenders or team schemes are vulnerable. You could build heatmaps showing where help is coming from, or use expected closeout times to show when rotations are too slow to matter. It&apos;s the kind of stuff that doesn&apos;t show up in a box score but completely changes a possession.
      </p>
      <p className="mb-4">
        We can also take the model one step further by building an <strong>Assist Opportunity Model</strong>. This shifts the focus from just “did the player pass?” to “should they have passed?” On every possession, we can identify teammates who were open in high-EP spots, even if the ball never got to them. That lets us track missed assists — not just in terms of stats left on the table, but in terms of decision-making. Are certain players drawing attention but failing to find open teammates? Are others consistently making the right read, even if the shot doesn&apos;t fall? This kind of insight helps reframe how we define playmaking — not just based on assists, but on the quality of decisions. And it&apos;s perfect for film breakdowns and development — showing players when they had a high-value pass available and what they missed.
      </p>
      <p className="mb-4">
        Together, these ideas unlock a much broader view of the game. You could build a full analytics suite around them — defensive dashboards, playmaker recognition tools, rotation breakdown visualizations — whatever fits your team&apos;s needs. And if you want to take it further, they can all be built into radar charts, interactive visuals, or scouting dashboards to help coaches, players, and execs make smarter decisions across the board.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Updated Features: Shot Maker Difficulty Value</h2>
      <p className="mb-4">
        Building on the foundation of expected points modeling, we&apos;ve introduced a new feature called the <strong>Shot Maker Difficulty Value</strong>. This metric captures the added value a player provides on a shot by comparing the actual outcome to the expected points (EP) based on shot quality. Specifically, it multiplies the result of the shot (1 for make, 0 for miss) by the point value of the shot (2 or 3), then subtracts the predicted EP. The result quantifies how much a shooter added (or left on the table) relative to expectations — essentially isolating the shot-making talent above what the model predicted. A positive value means the player hit a tough shot or added value through pure skill; a negative one reflects a missed opportunity or poor execution relative to a makeable look. This feature gives us a more refined way to evaluate players&apos; finishing ability and can be a powerful lens for identifying high-level scorers, analyzing performance under pressure, or evaluating consistency across different shot types and game contexts.
      </p>


    </div>
  );
}