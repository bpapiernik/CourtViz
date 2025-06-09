import Image from "next/image";
import Head from "next/head";
import Script from "next/script";

export default function PatrickWilliamsBlog() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Head>
        <title>Is There Still Hope for Patrick Williams?</title>
      </Head>

      <h1 className="text-3xl font-bold mb-2">
        Is There Still Hope for Patrick Williams?
      </h1>
      <p className="text-sm text-gray-500 mb-6">Brian Papiernik • June 2025</p>
      <div
        className="mb-6"
        dangerouslySetInnerHTML={{
            __html: `<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Sources: NBA Board of Governors has approved two new rules for the 2024-25 season — flopping penalty and coach’s challenge — to now be in effect full-time moving forward.</p>&mdash; Shams Charania (@ShamsCharania) <a href="https://twitter.com/ShamsCharania/status/1807267350401400898">June 26, 2025</a></blockquote>`,
        }}
        />

        <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
      <p className="mb-4">
        When Patrick Williams was selected 4th overall in the 2020 NBA Draft, he was viewed as a modern forward prototype - a versatile defender that can stretch the defense with the potential to grow into a two-way star. But as we enter the 2025-26 season, that potential player seems like an afterthought. 
      </p>
      <p className="mb-4">
        The numbers mentioned below paint a complicated picture. Williams remains stuck between projection and production after multiple injuries have slowed his development causing him to look lost on the floor.
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">What&apos;s Gone Wrong?</h2>
      <h3 className="text-xl font-semibold mt-4 mb-1">
        Mismatch in a Matchup League
      </h3>
      <Image
      src="/images/pw_ppp.png" 
      alt="Patrick Williams PPP"
      width={700}
      height={500}
      className="my-6 rounded shadow"
      />
      <p className="mb-4">
        The modern NBA is about creating advantages in the half court - 2-on1s in pick-and-rolls, 3-on-2s on the weak side, and rotating defenses with ball movement. Williams has lacked the ability to create these offensive advantages whether on or off the ball. In the 2024-25 season, Patrick Williams ranks in the 2nd percentile in Isolation PPP (0.35) and 18th percentile as a Pick-and-Roll Ball Hander (0.73 PPP). He doesn’t shift defenses, collapse help, or force rotations. 
      </p>
      <p className="mb-4">
        Williams isn’t much better moving off the ball. His cutting efficiency (0.74 PPP, 18th percentile in 2024-25) shows that he’s not consistently creating easy looks through timely cuts or off-ball screens when the defenders collapse on a ball-handler. Without this shot creation and movement, his defender can often sag off him to clog the lane or help with the pick-and-roll as the 3rd defender.
      </p>
      <p className="mb-4">
        This has resulted in Williams remaining a stationary spot-up shooter, which he performs above average (66th percentile, 1.06 PPP in 2024-25). This isn’t dangerous enough to cause Williams’ defender to remain tied to Willaims. Defenders can cheat off him in help coverage because Williams doesn’t remain an option to punish the defense with quick decisions. 
      </p>
      <h3 className="text-xl font-semibold mt-4 mb-1">
        Year 3 Was the Peak — Then Injuries Struck
        </h3>
      <p className="mb-4">In 2022–23, Williams quietly posted encouraging numbers before his foot issues:</p>
        <ul className="list-disc list-inside mb-4">
            <li><strong>Post-Ups:</strong> 80th percentile, 1.11 PPP</li>
            <li><strong>Transition:</strong> 75th percentile, 1.11 PPP</li>
            <li><strong>Cutting:</strong> 95th percentile, 1.36 PPP</li>
        </ul>
      <p className="mb-4">
            These numbers reflected a player who can find offensive touches in advantage roles as a finisher in space. Also, he ranked 63rd percentile in Pick-and-Roll ball-handling which showed potential to create on-ball. However, every offensive playtype saw a steep decline in PPP in 2024-25. One can say injuries and lack of rhythm played a role in this decline. 
      </p>
      <h3 className="text-xl font-semibold mt-4 mb-1">
        Defensive Slippage after Early Promise
      </h3>
      <p className="mb-4">
        Williams has shown glimmers becoming a lockdown defender when embracing contact before the injuries. In 2022-23, he held opponents to just 0.74 PPP in isolation - 87th percentile - a sign that he can contain one-on-one scorers when engaged during clutch time. 
      </p>
      <p className="mb-4">
        However, his 2024-25 data shows that his overall defensive value has regressed. He allowed below average PPP as the primary defender in pick-and-roll and off-screen situations. Whether due to injuries or lack of aggressiveness, his help-side defense and rotations have not improved. 
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">What Needs to Be Fixed?</h2>
      <h3 className="text-xl font-semibold mt-4 mb-1">
        Move Without the Ball
      </h3>
      <p className="mb-4">
        If Williams isn’t going to break defenders off the dribble, he needs to become more active and impactable as a mover. Off-ball activity - cuts, slip screens, or relocating after the pass - is essential to keeping the defenders engaged and creating space. Right now, he is too stationary, which makes the defender’s job easier with help defense. 
      </p>
      <h3 className="text-xl font-semibold mt-4 mb-1">
        Reclaim the Paint
      </h3>
      <p className="mb-4">
        In 2022-23, Williams flashed potential as an interior finishing - ranking 95th percentile on cuts (1.36 PPP) and 80th percentile on post-ups (1.11 PPP). Since then, his shot chart shows his below-average ability to finish at the rim with several hexagons shaded blue. He needs to get back to playing through contact. Designed actions like short rolls can help him regain his presence around the paint. 
      </p>
      <Image
      src="/images/shot_pw.png" 
      alt="Patrick Williams Shot Chart"
      width={700}
      height={500}
      className="my-6 rounded shadow"
      />
      <h3 className="text-xl font-semibold mt-4 mb-1">
        Crash the Glass
      </h3>
      <p className="mb-4">
        Rebounding is one of the simplest ways to impact the game with William’s size and length. Unfortunately, he isn’t doing enough crashing the glass with his OREB % ranking 37th percentile and his OREB Chance % ranking 37th percentile. Defensively, Williams has been better but underwhelming - 39th percentile in DREB Chance % and 65th percentile in DREB %. Given his athleticism and size, there is no reason he shouldn’t be more disruptive on the boards and create extra possessions. 
      </p>
      <h2 className="text-2xl font-semibold mt-6 mb-2">Is There Still Hope?</h2>
      <p className="mb-4">
        Yes, but the ceiling might be lower than expected. 
      </p>
      <p className="mb-4">
        Patrick Williams’ pre-injury 2022-23 season showed promise - not as an All-Star, but as a modern role player with defensive upside and opportunistic scoring. The injuries and absence of on-ball growth have set him back. There is still a path forward if he commits to off-ball impact and leans on his defense. In the moden NBA, non-creators can thrive if they move, space, and defend. Williams can be that guy. 
      </p>
    </div>
  );
}