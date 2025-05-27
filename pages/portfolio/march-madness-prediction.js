import Image from "next/image";
import Head from "next/head";

export default function MarchMadnessPrediction() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Head>
        <title>March Madness: NCAA Outcome Prediction</title>
      </Head>

      <h1 className="text-3xl font-bold mb-2">
        March Madness: Predicting College Basketball Game Outcome Probabilities
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Brian Papiernik • March 15, 2025
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Introduction</h2>
      <p className="mb-4">
        The primary focus of this project is to conduct analysis on the relationship between NCAA team-level performance metrics and player performance metrics, expanded with new Shot Quality metrics for both players and team, and their impact on March Madness outcomes in addition to regular season outcomes in an attempt to develop a predictive model for tournament success and team success in the regular season. The dataset consists of NCAA Division I statistics from March Madness tournament teams over the past five years, incorporating advanced box score metrics from Torvik, player-specific Bayesian Performance Ratings (BPR) from EvanMiya.com, and Shot Quality data at both the team and player levels. These include offensive shot type efficiencies and frequencies for teams, player-level Shot Quality Points Per Possession (SQ.PPP), and Shot Making metrics.
      </p>

      <p className="mb-4">
        Additionally, I created my own derived variables using matchup-level differences in the key metrics between opposing teams to enhance the accuracy and predictive value of the model against our binary “team winner” variable each game_id for the regular season games and March Madness games of March Madness teams from the past 5 years. These variables include team differential efficiency ratings, team shot quality metrics, and player-level performance indicators. My analysis aims to provide valuable insight into NCAA tournament forecasting and regular season team forecasting by investigating how advanced offensive and defensive metrics, combined with team composition and shot quality analytics, can help identify the key influences of success in regular season games and NCAA tournament games.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Motivation</h2>
      <p className="mb-4">
        Over the past several NCAA season, there has been a growing interest in identifying what truly drives success in March Madness and in the regular season for March Madness teams. While traditional metrics like win-loss records and seedings play a role in public brackets and popular upsets, they often fail to capture the deeper team-level dynamics and player efficiencies that can influence tournament outcomes. With the growing availability of advanced analytics in college basketball that first started with KenPom and has continued to grow - including player impact adjusted plus minus ratings, shot quality metrics, and playtype efficiencies - there&apos;s an opportunity to leverage these tools to better understand what separates winning teams from those that fall short.
      </p>
      <p className="mb-4">
         This project also recognizes the increasing influence of the transfer portal in shaping modern college basketball rosters. With more players switching programs each year, the ability to assess a player&apos;s shot quality profile and performance impact in the context of their potential fit with a new team has never been more valuable . By incorporating these insights, this model can not only forecast game outcomes, but also serve as a tool to assist in roster construction, player evaluation, and transfer market scouting.
      </p>
      <p className="mb-4">
        For example, Elliot Cadeau is one of the premium transfer candidates and might be hard to potentially replace for North Carolina, but the real question is whether he was beneficial to the Tar Heels team and worth the potential NIL value that he wants.When Elliot Cadeau is off the court, the team posts a slightly higher offensive rating (114.1 vs. 113.5) and shoots better from three (37.9% vs. 34.5%) with a higher three-point attempt rate (39.2% vs. 36.5%). However, when he&apos;s on the floor, the team shifts toward a more rim-focused offense (RIM rate = 47.0% vs. 39.5%) and generates more assisted field goals (AST rate = 53.2% vs. 47.9%), indicating his ability to break down defenses and create high-quality looks inside.
        </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Status Comparison</h2>
      <table className="w-full text-sm border mb-6">
        <thead>
          <tr>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">ORTG</th>
            <th className="border px-2 py-1">3P%</th>
            <th className="border px-2 py-1">3P Rate</th>
            <th className="border px-2 py-1">AST Rate</th>
            <th className="border px-2 py-1">RIM Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">Cadeau On</td>
            <td className="border px-2 py-1">113.5</td>
            <td className="border px-2 py-1">34.5%</td>
            <td className="border px-2 py-1">36.5%</td>
            <td className="border px-2 py-1">53.2%</td>
            <td className="border px-2 py-1">47.0%</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Cadeau Off</td>
            <td className="border px-2 py-1">114.1</td>
            <td className="border px-2 py-1">37.9%</td>
            <td className="border px-2 py-1">39.2%</td>
            <td className="border px-2 py-1">47.9%</td>
            <td className="border px-2 py-1">39.5%</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Problem</h2>
      <p className="mb-4">
       This project aims to investigate the relationship between team and player-level performance metrics - specifically metrics from Torvik, EvanMiya.com, and ShotQuality data - and the outcomes of NCAA basketball games. The analysis focuses on both regular season and March Madness tournament play, incorporating matchup-level differences between the two teams for the performance metrics and derived features to build a binary classification model for game prediction. Additionally, the model is applied to evaluate individual player metrics to assess how their offensive efficiency, shot selection, and shot-making may translate to a team. The ultimate goal is to use these insights to improve game forecasting and inform data-driven roster-building strategies. The ultimate goal is to use these insights to improve game forecasting and inform data-driven roster-building strategies. Once trained, the model is used to simulate matchups 10,000 to 100,000 times, generating a win probability for each team in any given head-to-head scenario.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">Variables of Interest</h2>
      <p className="mb-4">
         Understanding the impact of team-level efficiencies, playtype efficiencies and frequencies, and individual shot quality metrics is critical for both predictive modeling and future roster construction in NCAA basketball...
      </p>
      <ul className="list-disc pl-6 space-y-6 text-gray-800">
        <li>
            <span className="font-semibold">Team-Level Metrics:</span>
            <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><em>EFG_O / EFG_D</em>: Effective field goal percentage (offense/defense)</li>
            <li><em>TOr / TOrD</em>: Turnover rate (offense/defense)</li>
            <li><em>ORB / DRB</em>: Offensive/defensive rebounding rate</li>
            <li><em>FTR / FTRD</em>: Free throw rate (offense/defense)</li>
            <li><em>2P% / 3P%</em>: Offense/Defense shooting percentages</li>
            </ul>
        </li>

        <li>
            <span className="font-semibold">Player-Level Metrics:</span>
            <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
                <em>Bayesian Performance Ratings Offense and Defense (BPR)</em> from 
                <a href="https://evanmiya.com" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">EvanMiya.com</a> 
                for each player (Player 1 through 8)
            </li>
            <li><em>ShotQuality Points Per Possession (SQ.PPP)</em> per player (Player 1 through 8)</li>
            <li><em>Shot Making</em> and <em>Good Possession Rate</em> (Player 1 through 8)</li>
            </ul>
        </li>

        <li>
            <span className="font-semibold">Shot Type & Playtype Efficiency Metrics</span> (Team-Level, from ShotQuality):
            <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Catch-and-Shoot 3PT Frequency & SQ.PPP</li>
            <li>Finishing at the Rim Frequency & SQ.PPP</li>
            <li>Off-Screen, P&R Ball Handler, Isolation, Transition, Half Court, Cut, Post-Up metrics</li>
            <li>Midrange & Off-the-Dribble 3PT frequency and efficiency</li>
            </ul>
        </li>

        <li>
            <span className="font-semibold">Derived Matchup-Level Variables:</span>
            <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Differences between opposing teams&apos; metrics (e.g., <code>diff_EFG_O</code>, <code>diff_P.R.Ball.Screen.SQ.PPP</code>)</li>
            <li>Differences in player-level BPR, SQ.PPP, Shot Making, and usage profiles</li>
            </ul>
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Problem Framing</h2>
      <p className="mb-4">
        The end goal of this project is to improve NCAA game outcome prediction and player evaluation by integrating advanced team-level and player-level metrics with Shot Quality (SQ) data. By identifying the key factors that drive both regular season and March Madness success, we can better understand not only what leads to winning basketball, but also how players contribute to that success within different systems. With the increasing impact of the transfer portal, being able to assess a player&apos;s efficiency, shot selection, and overall impact across contexts is essential for modern roster construction.
      </p>
      <p className="mb-4">
       This project builds on five years of tournament team data and incorporates performance-based player metrics like Bayesian Performance Rating (BPR), SQ Points Per Possession, and Shot Making as well as team playtype frequencies and efficiencies. The predictive model focuses on binary game outcomes “team-winner” by using matchup level feature differences between opposing teams to simulate head-to-head scenarios. Although not every game is decided by statistical imbalances between the two teams' strategies, the ability to quantify team strengths and weaknesses in relative term allows us to simulate thousands of matchups and identify the most probable outcomes.
      </p>
      

      <h2 className="text-2xl font-semibold mt-6 mb-2">Proposed Solution</h2>
      <p className="mb-4">
        To tackle this project, I used a mix of statistical modeling and machine learning techniques in R—mainly an XGBoost classification model—to analyze five years of NCAA team and player data. The model pulls in team box score stats from Torvik, player impact ratings from EvanMiya.com, and detailed shot type and efficiency data from ShotQuality. To better capture how teams match up, I also created new features that calculate the differences in shooting efficiency, usage patterns, playstyle, and top-8 player-level metrics between opponents.
      </p>
      <p className="mb-4">
        The schema diagram shown below outlines how the datasets were joined based on shared keys such as team, player_name, season, and game_id. All tables were joined and processed in R to ensure consistency in data formatting and alignment.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">Data Description</h2>
      <p className="mb-4">
        To build the predictive model for NCAA game outcomes and player evaluation, this project required linking together several complementary datasets from reputable sources, including <strong>ShotQuality</strong>, <strong>Torvik</strong>, <strong>EvanMiya</strong>, and <strong>hoopR</strong>-based team game logs. These sources collectively cover team and player-level performance, playtype efficiency, and contextual shot quality metrics across five NCAA seasons. The final merged dataset contains a comprehensive mix of team metrics, player impact scores, and matchup-level derived variables. These variables allow us to simulate realistic team matchups and evaluate which features best predict game outcomes during the regular season and March Madness.
      </p>
      <p className="mb-4">
        The schema diagram shown below outlines how the datasets were joined based on shared keys such as <code>team</code>, <code>player_name</code>, <code>season</code>, and <code>game_id</code>. All tables were joined and processed in R to ensure consistency in data formatting and alignment.
      </p>
      
      <Image
      src="/images/image2.png"
      alt="Schema Diagram"
      width={800}
      height={500}
      className="rounded shadow-md mb-6"
      />

      <h3 className="text-xl font-semibold mt-6 mb-2">Data Sources:</h3>

      <h4 className="text-lg font-semibold mt-4 mb-1">Games Table (hoopR)</h4>
      <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-800">
        <li><strong>Key Columns:</strong> <code>team_location</code>, <code>opposing_team_location</code>, <code>season</code>, <code>game_id</code>, <code>team_winner</code></li>
        <li>Used as the foundation of the model, containing each game’s matchup, home/away context, and binary win outcome (<code>team_winner</code>) used as the target variable.</li>
        <li>Acts as the central table to which all others are joined.</li>
      </ul>

      <h4 className="text-lg font-semibold mt-4 mb-1">Torvik Team Metrics</h4>
      <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-800">
        <li><strong>Key Columns:</strong> <code>team</code>, <code>season</code>, <code>seed</code>, <code>various_torvik_metrics</code></li>
        <li>Contains advanced team-level metrics from barttorvik.com, including offensive/defensive efficiency, pace, shooting splits, turnover rates, and more.</li>
        <li>These metrics are used to represent historical team performance and efficiency-based indicators.</li>
      </ul>

      <h4 className="text-lg font-semibold mt-4 mb-1">EvanMiya Player Impact Metrics</h4>
      <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-800">
        <li><strong>Key Columns:</strong> <code>player_name</code>, <code>team</code>, <code>season</code>, <code>obpr</code>, <code>dbpr</code>, <code>bpr</code></li>
        <li>Provides on-court impact ratings (offensive, defensive, and total Bayesian Performance Rating) for players.</li>
        <li>Players are sorted by team and top 8 contributors are tracked in each matchup to build player-level context into the model.</li>
        <li>
          <strong>BPR:</strong> Bayesian Performance Rating is the sum of a player’s OBPR and DBPR. This rating is the ultimate measure of a player’s overall value to his team when he is on the floor. It reflects the number of points per 100 possessions better than the opponent the player’s team is expected to be if he were on the court with 9 average players.
        </li>
      </ul>

      <h4 className="text-lg font-semibold mt-4 mb-1">ShotQuality – Player Metrics</h4>
      <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-800">
        <li><strong>Key Columns:</strong> <code>player_name</code>, <code>team</code>, <code>season</code>, <code>SQ_PPP</code>, <code>Shot_Making</code>, <code>Good_Possession_Rate</code></li>
        <li>Captures individual player shooting quality and shot-making performance based on expected shot value and conversion rate.</li>
        <li>Helps assess the reliability and offensive efficiency of each player beyond box score stats.</li>
        <li>Top 8 contributors are tracked per team to build player-level matchup context into the model.</li>
      </ul>

      <h4 className="text-lg font-semibold mt-4 mb-1">ShotQuality – Team Playtype Efficiency</h4>
      <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-800">
        <li><strong>Key Columns:</strong> <code>team</code>, <code>season</code>, <code>various_shottype_freq</code>, <code>various_shottype_efficiencyPPP</code></li>
        <li>Includes frequency and expected points per possession for key playtypes (e.g., Catch & Shoot 3s, Rim Finishing, Transition, Isolation).</li>
        <li>Enables matchup-level comparisons of offensive identity and playstyle effectiveness.</li>
      </ul>


      <h2 className="text-2xl font-semibold mt-6 mb-4">Derived Variables</h2>

      <p className="mb-4">
        To improve matchup modeling, new features were created using differences in team and player metrics between opposing sides. These matchup-level differential variables included:
      </p>

      <ul className="list-disc pl-6 space-y-2 text-gray-800 mb-4">
        <li>Differences in team-level efficiency ratings</li>
        <li>Differences in player Shot Quality (<code>SQ_PPP</code>, Shot Making, <code>BPR</code>)</li>
        <li>Gaps in playtype frequencies and efficiency (e.g., Catch & Shoot 3PT <code>SQ_PPP</code>, Transition Frequency)</li>
        <li>Gaps in offensive/defensive balance between top 1–8 contributors</li>
      </ul>
      <p className="mb-6">
        These derived features were engineered in R and stored with the <code>game_id</code> and <code>team_location</code> context to support full simulation capabilities.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Data Split</h2>
      <p className="mb-4">
        To train and evaluate the model fairly, the dataset was split into a training set (70%) and a test set (30%) using stratified sampling based on the “team_winner” outcome. This split ensures balance win/loss data across both datasets and allows us to validate how well the model generalizes to new team matchups
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Methods</h2>
      <p className="mb-4">
        The next model run is an XGBoost model where decision trees are built sequentially in order to reduce error from the previous trees by updating residuals. This model is used to find relationships within complex datasets, as we have here with multiple datasets merged together from ShotQuality, Torvik, and EvanMiya. Effectively, an XGBoost model uses weak learners where the bias is high and the predictive power is only a small amount higher than random guessing. By sequentially combining these weak learners through boosting, we create a strong learner with low bias and variance. An XGBoost model is perfect for this project as it handles the complexity of matchup-level features, playtype efficiencies, and player-level ratings that go into predicting NCAA outcomes. Another reason this model is great to use is that XGBoost is easy to tune—though it can take time—and it provides a ranking of variables. With the high number of variables this dataset has, the variable ranking will help those creating insights understand which ones to focus on so they can better evaluate teams, simulate outcomes, and make informed decisions.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Results</h2>
      <p className="mb-4">
        In this project, we implemented an XGBoost classification model to predict binary game outcomes (win or loss) based on a wide range of team and player performance metrics. These included matchup-level differences derived from ShotQuality data (e.g., shot-making, shot type efficiency), Torvik’s advanced team metrics (e.g., offensive/defensive ratings, tempo), and EvanMiya’s player-level impact scores (e.g., BPR). The model was trained on a merged dataset over five seasons of NCAA regular season and March Madness games for tournament-eligible teams.
      </p>
      <p className="mb-4">
        Before training, we preprocessed the dataset and converted it into an <code>xgb.DMatrix</code> format. The XGBoost model served as the foundation for generating simulated matchup outcomes and win probabilities, providing a solid framework for NCAA tournament forecasting and roster evaluation.
      </p>
      <p className="mb-4">
        <strong>XGBoost:</strong> To predict the outcome of NCAA games, we used an XGBoost classification model to analyze complex interactions between team-level metrics, ShotQuality playtype features, and player-specific impact variables. The model was tuned using a tuning approach with AUC (Area Under the Curve) as the key metric. Key hyperparameters included a learning rate of 0.3, max depth of 15, minimum child weight of 15, gamma of 0.1, subsample of 0.6, and column sample by tree of 0.6. These settings allowed the model to learn from feature differences across matchups while avoiding overfitting.
      </p>
      <p className="mb-4">
        The XGBoost model outputs a predicted probability that a given team will win a game based on these features, which are then used in thousands of simulated matchups to estimate overall win likelihood. To better understand what influenced the model's predictions, we used SHAP (SHapley Additive exPlanations) to visualize the impact of individual features on model output.
      </p>
      <Image
      src="/images/image3.png"
      alt="SHAP Plot"
      width={800}
      height={500}
      className="rounded shadow-md mb-6"
      />
      <p className="mb-4">
        In the SHAP summary plot shown, each row represents a feature used in the model, and each point is a single game's SHAP value for that feature. The x-axis represents the impact of the feature on the model’s output—positive values push the model toward predicting a win for the team, while negative values push it toward predicting a loss. The color indicates the feature value for that specific point: purple means a high feature value, and yellow means a low value.
      </p>
      <p className="mb-4">
        For this plot, diff_obpr_Player_3 is the most important feature overall, meaning the difference in offensive Bayesian Performance Rating between the third-most important player on each team had the biggest impact on predictions. Purple dots to the right suggest that a higher obpr difference (favoring that team’s player) increases win probability, while yellow dots to the left indicate that a low or negative obpr difference (favoring the opponent) decreases it.
      </p>
      <p className="mb-4">
        Across the top features, both offensive (diff_obpr) and defensive (diff_dbpr) player impact metrics for the top 5 players per team appear frequently, showing that individual player performance still drives much of the predicted game outcome. Team-level features like free throw rate differential, rim frequency, and shot-making ability also influence predictions. This emphasizes the importance of playstyle matchups and execution efficiency.
      </p>
      <p className="mb-4">
        By breaking down model predictions, SHAP not only identifies which features the model relies on most, but also how they contribute in different contexts by offering transparency in the model's logic. This is especially useful when applying the model to evaluate new matchups or transfer portal additions because we can assess exactly how a player or team’s strengths are likely to influence projected game outcomes.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Model Evaluation, Simulation Framework, and Future Applications</h2>
      <p className="mb-4">
        The final XGBoost model reached an AUC of 0.7806, which shows it performs well at predicting game outcomes based on a combined set of team and player metrics. In simple terms, if you randomly choose one game a team won and one they lost, the model correctly gives a higher win probability to the win about 78% of the time. That means it generally has a good sense of which games were more likely wins. This suggests the model is picking up on meaningful patterns across features like playtype efficiency, shot quality, and team-level impact ratings—which is no small feat given how unpredictable March Madness can be and how complex NCAA basketball matchups are.
      </p>
      <p className="mb-4">
        To take this a step further, I built a simulation function to model NCAA matchups thousands of times. For each simulation, the model predicts a win probability based on the matchup-level features of the two teams. Then, it draws a random number from a uniform distribution and compares it to that predicted probability—if the probability is higher, that team is recorded as the winner for that simulation. Running this process 10,000 to 100,000 times gives an empirical win rate: a more realistic estimate of how often a team would win that matchup. This Monte Carlo-style simulation helps account for the randomness and uncertainty that are always part of real-life games, giving us more useful bracket projections, upset alerts, and team comparisons.
      </p>
      <p className="mb-4">
        After generating those simulated win probabilities, I compared them to public expectations—specifically the outcomes implied by point spreads. For example, if the spread says a team should win by 7, but the model sees it closer to a 5-point edge, it could suggest the other team is being undervalued. These differences often reflect matchup-specific details like shot selection, player efficiency, defensive consistency, or roster makeup. By tracking these kinds of mismatches across lots of games, we can get a better sense of how well the model is spotting teams that might be overlooked or misjudged compared to the broader public view especially if the differences in the point edge is 3+ points. The goal here isn’t to beat the betting markets—it’s to see how well a data-driven approach captures the deeper dynamics that traditional metrics might miss.
      </p>


      <h2 className="text-2xl font-semibold mt-6 mb-2">Next Steps: Transfer Portal Fit and Roster Evaluation</h2>
      <p className="mb-4">
        Beyond predicting game outcomes, this model can also help teams make smarter decisions in the transfer portal and build better rosters. By incorporating player-level ShotQuality metrics, shot selection tendencies, and Bayesian Performance Ratings, the model can evaluate how well a transfer prospect would fit into a new team’s offensive or defensive system.
      </p>
      <p className="mb-4">
        We can compare a player’s current profile to the style of a potential destination looking at various playstyle metrics when they're on versus off the court. This allows teams to assess how much of a player’s impact will translate and whether their strengths complement the roster already in place. Whether it’s a rim-heavy offense, a fast-paced transition attack, or a three-point-oriented system, the model helps answer: Does this player belong here?
      </p>
      <p className="mb-4">
        One key use of this is replacement value modeling. When a team loses a key contributor to the portal, the model can estimate how much production is leaving—and which available players have similar statistical and stylistic profiles to fill the gap. If a team loses a high-assist point guard who excels at attacking the rim, the model can flag transfer options with similar shot profiles and ShotQuality efficiency metrics, giving coaches a realistic shortlist of replacements that fit their system.
      </p>
      <p className="mb-4">
        Take Elliot Cadeau, one of the most notable players currently in the portal. While he’s a high-profile loss for North Carolina, the data paints a more nuanced picture. When Cadeau was on the floor, UNC’s offensive rating actually dipped slightly (113.5 vs. 114.1), and their three-point shooting volume and accuracy went down. However, his presence increased their rim rate and assist rate—highlighting his ability to create offense and pressure the paint, but also suggesting he may constrain floor spacing. Using the model, we can simulate how a player like Cadeau would affect a different team based on their specific lineup and style, helping identify programs where he’d be a better fit.
      </p>
      <Image src="/images/image1.png" alt="Assist Rate vs Shot Making" width={800} height={500} className="rounded shadow-md mb-4" />
      <p className="mb-4">
        To visualize this, I created a chart comparing assist rate to shot-making ability for every point guard currently in the portal. Cadeau lands in the bottom-right quadrant: elite in playmaking, but below average in shot-making. This supports the earlier insight—he’s a dynamic facilitator who boosts rim pressure, but teams that rely on spacing and perimeter scoring may need to adjust around him.
      </p>
      <p className="mb-4">
        The chart also helps highlight other guard archetypes: balanced dual threats who can both score and assist (top right), score-first creators (top left), and traditional pass-first guards who thrive when surrounded by finishers. This kind of visual not only helps with evaluating individual players but also with identifying undervalued fits—players who might thrive in the right environment even if their raw stats don’t pop.
      </p>
      <p className="mb-4">
        In short, this approach brings more clarity and depth to roster evaluation—bridging the gap between numbers and strategy, and helping coaches build smarter, better-balanced teams.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Code</h2>
      <p className="mb-2">You can view the full source code for this project below:</p>
      <a href="https://github.com/bpapiernik/March-Madness-Predicting-College-Basketball-Game-Outcome-Probabilities" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        View on GitHub →
      </a>
    </div>
  );
}
