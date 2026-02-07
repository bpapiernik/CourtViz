// pages/players/[id].js

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import PercentileSlider from '../../components/PercentileSlider';
import PercentileSlider2 from '../../components/PercentileSlider2';
import dynamic from 'next/dynamic';
const ShotChart = dynamic(() => import('../../components/ShotChart'), { ssr: false });


// Define stat groups and display names
const statGroups = {
  "Speed Distance": [
    "DIST_MILES_OFF_SpeedDistance_pct",
    "DIST_MILES_DEF_SpeedDistance_pct",
    "AVG_SPEED_SpeedDistance_pct",
    "AVG_SPEED_OFF_SpeedDistance_pct",
    "AVG_SPEED_DEF_SpeedDistance_pct",
  ],
  "Rebounding": [
    "OREB_Rebounding_pct",
    "OREB_CONTEST_Rebounding_pct",
    "OREB_CONTEST_PCT_Rebounding_pct",
    "OREB_CHANCES_Rebounding_pct",
    "OREB_CHANCE_PCT_Rebounding_pct",
    "OREB_UNCONTEST_Rebounding_pct",
    "AVG_OREB_DIST_Rebounding_pct",
    "DREB_Rebounding_pct",
    "DREB_CONTEST_Rebounding_pct",
    "DREB_CONTEST_PCT_Rebounding_pct",
    "DREB_CHANCES_Rebounding_pct",
    "DREB_CHANCE_PCT_Rebounding_pct",
    "DREB_UNCONTEST_Rebounding_pct",
    "AVG_DREB_DIST_Rebounding_pct",
  ],
  "Catch and Shoot": [
    "CATCH_SHOOT_PTS_CatchShoot_pct",
    "CATCH_SHOOT_FGM_CatchShoot_pct",
    "CATCH_SHOOT_FGA_CatchShoot_pct",
    "CATCH_SHOOT_FG_PCT_CatchShoot_pct",
    "CATCH_SHOOT_FG3M_CatchShoot_pct",
    "CATCH_SHOOT_FG3A_CatchShoot_pct",
    "CATCH_SHOOT_FG3_PCT_CatchShoot_pct",
    "CATCH_SHOOT_EFG_PCT_CatchShoot_pct",
  ],
  "Pull Up Shots": [
    "PULL_UP_PTS_PullUpShot_pct",
    "PULL_UP_FGM_PullUpShot_pct",
    "PULL_UP_FGA_PullUpShot_pct",
    "PULL_UP_FG_PCT_PullUpShot_pct",
    "PULL_UP_FG3M_PullUpShot_pct",
    "PULL_UP_FG3A_PullUpShot_pct",
    "PULL_UP_FG3_PCT_PullUpShot_pct",
    "PULL_UP_EFG_PCT_PullUpShot_pct",

  ],
  "Drives": [
    "DRIVES_Drives_pct",
    "DRIVE_PTS_Drives_pct",
    "DRIVE_PTS_PCT_Drives_pct",
    "DRIVE_FGM_Drives_pct",
    "DRIVE_FGA_Drives_pct",
    "DRIVE_FG_PCT_Drives_pct",
    "DRIVE_FTA_Drives_pct",
    "DRIVE_PASSES_PCT_Drives_pct",
    "DRIVE_AST_PCT_Drives_pct",
    "DRIVE_TOV_PCT_Drives_pct",
    "DRIVE_PF_PCT_Drives_pct",
  ],
  "Passing": [
    "PASSES_MADE_Passing_pct",
    "PASSES_RECEIVED_Passing_pct",
    "AST_Passing_pct",
    "SECONDARY_AST_Passing_pct",
    "POTENTIAL_AST_Passing_pct",
    "FT_AST_Passing_pct",
    "AST_POINTS_CREATED_Passing_pct",
    "AST_ADJ_Passing_pct",
    "AST_TO_PASS_PCT_Passing_pct",
  ],
  "Elbow Touches": [
    "ELBOW_TOUCHES_ElbowTouch_pct",
    "ELBOW_TOUCH_PTS_ElbowTouch_pct",
    "ELBOW_TOUCH_PTS_PCT_ElbowTouch_pct",
    "ELBOW_TOUCH_FGM_ElbowTouch_pct",
    "ELBOW_TOUCH_FGA_ElbowTouch_pct",
    "ELBOW_TOUCH_FG_PCT_ElbowTouch_pct",
    "ELBOW_TOUCH_FTA_ElbowTouch_pct",
    "ELBOW_TOUCH_AST_PCT_ElbowTouch_pct",
    "ELBOW_TOUCH_PASSES_PCT_ElbowTouch_pct",
    "ELBOW_TOUCH_TOV_PCT_ElbowTouch_pct",
  ],
  "Post Touches": [
    "POST_TOUCHES_PostTouch_pct",
    "POST_TOUCH_PTS_PostTouch_pct",
    "POST_TOUCH_PTS_PCT_PostTouch_pct",
    "POST_TOUCH_FGM_PostTouch_pct",
    "POST_TOUCH_FGA_PostTouch_pct",
    "POST_TOUCH_FG_PCT_PostTouch_pct",
    "POST_TOUCH_FTA_PostTouch_pct",
    "POST_TOUCH_AST_PCT_PostTouch_pct",
    "POST_TOUCH_PASSES_PCT_PostTouch_pct",
    "POST_TOUCH_TOV_PCT_PostTouch_pct",
  ],
  "Paint Touches": [
    "PAINT_TOUCHES_PaintTouch_pct",
    "PAINT_TOUCH_PTS_PaintTouch_pct",
    "PAINT_TOUCH_PTS_PCT_PaintTouch_pct",
    "PAINT_TOUCH_FGM_PaintTouch_pct",
    "PAINT_TOUCH_FGA_PaintTouch_pct",
    "PAINT_TOUCH_FG_PCT_PaintTouch_pct",
    "PAINT_TOUCH_FTA_PaintTouch_pct",
    "PAINT_TOUCH_AST_PCT_PaintTouch_pct",
    "PAINT_TOUCH_PASSES_PCT_PaintTouch_pct",
    "PAINT_TOUCH_TOV_PCT_PaintTouch_pct",
  ],
  All: [] 
};

statGroups.All = Array.from(new Set(Object.values(statGroups).flat()));

const statNameMap = {
  // Speed Distance
  "DIST_MILES_OFF_SpeedDistance_pct": "Distance Miles (Offense)",
  "DIST_MILES_DEF_SpeedDistance_pct": "Distance Miles (Defense)",
  "AVG_SPEED_SpeedDistance_pct": "Average Speed (Total)",
  "AVG_SPEED_OFF_SpeedDistance_pct": "Average Speed (Offense)",
  "AVG_SPEED_DEF_SpeedDistance_pct": "Average Speed (Defensive)",

  // Rebounding
  "OREB_Rebounding_pct": "OREB %",
  "OREB_CONTEST_Rebounding_pct": "Contested OREB",
  "OREB_CONTEST_PCT_Rebounding_pct": "Contested OREB %",
  "OREB_CHANCES_Rebounding_pct": "OREB Chances",
  "OREB_CHANCE_PCT_Rebounding_pct": "OREB Chance %",
  "OREB_UNCONTEST_Rebounding_pct": "Uncontested OREB",
  "AVG_OREB_DIST_Rebounding_pct": "Avg OREB Distance",
  "DREB_Rebounding_pct": "DREB %",
  "DREB_CONTEST_Rebounding_pct": "Contested DREB",
  "DREB_CONTEST_PCT_Rebounding_pct": "Contested DREB %",
  "DREB_CHANCES_Rebounding_pct": "DREB Chances",
  "DREB_CHANCE_PCT_Rebounding_pct": "DREB Chance %",
  "DREB_UNCONTEST_Rebounding_pct": "Uncontested DREB",
  "AVG_DREB_DIST_Rebounding_pct": "Avg DREB Distance",

  // Catch and Shoot
  "CATCH_SHOOT_PTS_CatchShoot_pct": "Points (PTS)",
  "CATCH_SHOOT_FGM_CatchShoot_pct": "Field Goals Made (FGM)",
  "CATCH_SHOOT_FGA_CatchShoot_pct": "Field Goals Attempts (FGA)",
  "CATCH_SHOOT_FG_PCT_CatchShoot_pct": "Field Goal % (FG%)",
  "CATCH_SHOOT_FG3M_CatchShoot_pct": "3 Pointer Made (3PM)",
  "CATCH_SHOOT_FG3A_CatchShoot_pct": "3 Pointer Attempts (3PA)",
  "CATCH_SHOOT_FG3_PCT_CatchShoot_pct": "3 Point % (3P%)",
  "CATCH_SHOOT_EFG_PCT_CatchShoot_pct": "Catch & Shoot eFG%",

  // Pull Up Shots
  "PULL_UP_PTS_PullUpShot_pct": "Points (PTS)",
  "PULL_UP_FGM_PullUpShot_pct": "Field Goals Made (FGM)",
  "PULL_UP_FGA_PullUpShot_pct": "Field Goals Attempts (FGA)",
  "PULL_UP_FG_PCT_PullUpShot_pct": "Field Goal % (FG%)",
  "PULL_UP_FG3M_PullUpShot_pct": "3 Pointer Made (3PM)",
  "PULL_UP_FG3A_PullUpShot_pct": "3 Pointer Attempts (3PA)",
  "PULL_UP_FG3_PCT_PullUpShot_pct": "3 Point % (3P%)",
  "PULL_UP_EFG_PCT_PullUpShot_pct": "Pull-Up eFG%",

  // Drives
  "DRIVES_Drives_pct": "Drives",
  "DRIVE_PTS_Drives_pct": "Points (PTS)",
  "DRIVE_PTS_PCT_Drives_pct": "Points % (PTS %)",
  "DRIVE_FGM_Drives_pct": "Field Goals Made (FGM)",
  "DRIVE_FGA_Drives_pct": "Field Goals Attempts (FGA)",
  "DRIVE_FG_PCT_Drives_pct": "Field Goal % (FG%)",
  "DRIVE_FTA_Drives_pct": "Free Throw Attempts (FTA)",
  "DRIVE_PASSES_PCT_Drives_pct": "Pass %",
  "DRIVE_AST_PCT_Drives_pct": "Assist %",
  "DRIVE_TOV_PCT_Drives_pct": "Turnover %",
  "DRIVE_PF_PCT_Drives_pct": "Personal Foul %",

  // Passing
  "PASSES_MADE_Passing_pct": "Passes Made",
  "PASSES_RECEIVED_Passing_pct": "Passes Received",
  "AST_Passing_pct": "Assists",
  "SECONDARY_AST_Passing_pct": "Secondary Assists",
  "POTENTIAL_AST_Passing_pct": "Potential Assists",
  "FT_AST_Passing_pct": "Free Throw Assists",
  "AST_POINTS_CREATED_Passing_pct": "Assist Point Created",
  "AST_ADJ_Passing_pct": "Adjusted Assists",
  "AST_TO_PASS_PCT_Passing_pct": "Assist to Pass %",

  // Elbow Touches
  "ELBOW_TOUCHES_ElbowTouch_pct": "Elbow Touches",
  "ELBOW_TOUCH_PTS_ElbowTouch_pct": "Points (PTS)",
  "ELBOW_TOUCH_PTS_PCT_ElbowTouch_pct": "Points % (PTS %)",
  "ELBOW_TOUCH_FGM_ElbowTouch_pct": "Field Goals Made (FGM)",
  "ELBOW_TOUCH_FGA_ElbowTouch_pct": "Field Goals Attempts (FGA)",
  "ELBOW_TOUCH_FG_PCT_ElbowTouch_pct": "Field Goal % (FG%)",
  "ELBOW_TOUCH_FTA_ElbowTouch_pct": "Free Throw Attempts (FTA)",
  "ELBOW_TOUCH_AST_PCT_ElbowTouch_pct": "Assist %",
  "ELBOW_TOUCH_PASSES_PCT_ElbowTouch_pct": "Pass %",
  "ELBOW_TOUCH_TOV_PCT_ElbowTouch_pct": "Turnover %",

  // Post Touches
  "POST_TOUCHES_PostTouch_pct": "Post Touches",
  "POST_TOUCH_PTS_PostTouch_pct": "Points (PTS)",
  "POST_TOUCH_PTS_PCT_PostTouch_pct": "Points % (PTS %)",
  "POST_TOUCH_FGM_PostTouch_pct": "Field Goals Made (FGM)",
  "POST_TOUCH_FGA_PostTouch_pct": "Field Goals Attempts (FGA)",
  "POST_TOUCH_FG_PCT_PostTouch_pct": "Field Goal % (FG%)",
  "POST_TOUCH_FTA_PostTouch_pct": "Free Throw Attempts (FTA)",
  "POST_TOUCH_AST_PCT_PostTouch_pct": "Assist %",
  "POST_TOUCH_PASSES_PCT_PostTouch_pct": "Pass %",
  "POST_TOUCH_TOV_PCT_PostTouch_pct":  "Turnover %",

  // Paint Touches
  "PAINT_TOUCHES_PaintTouch_pct": "Paint Touches",
  "PAINT_TOUCH_PTS_PaintTouch_pct": "Points (PTS)",
  "PAINT_TOUCH_PTS_PCT_PaintTouch_pct": "Points % (PTS %)",
  "PAINT_TOUCH_FGM_PaintTouch_pct": "Field Goals Made (FGM)",
  "PAINT_TOUCH_FGA_PaintTouch_pct": "Field Goals Attempts (FGA)",
  "PAINT_TOUCH_FG_PCT_PaintTouch_pct": "Field Goal % (FG%)",
  "PAINT_TOUCH_FTA_PaintTouch_pct": "Free Throw Attempts (FTA)",
  "PAINT_TOUCH_AST_PCT_PaintTouch_pct": "Assist %",
  "PAINT_TOUCH_PASSES_PCT_PaintTouch_pct": "Pass %",
  "PAINT_TOUCH_TOV_PCT_PaintTouch_pct": "Turnover %"
};

const teamIdToName = {
  1610612737: 'Atlanta Hawks', 1610612738: 'Boston Celtics', 1610612739: 'Cleveland Cavaliers',
  1610612740: 'New Orleans Pelicans', 1610612741: 'Chicago Bulls', 1610612742: 'Dallas Mavericks',
  1610612743: 'Denver Nuggets', 1610612744: 'Golden State Warriors', 1610612745: 'Houston Rockets',
  1610612746: 'Los Angeles Clippers', 1610612747: 'Los Angeles Lakers', 1610612748: 'Miami Heat',
  1610612749: 'Milwaukee Bucks', 1610612750: 'Minnesota Timberwolves', 1610612751: 'Brooklyn Nets',
  1610612752: 'New York Knicks', 1610612753: 'Orlando Magic', 1610612754: 'Indiana Pacers',
  1610612755: 'Philadelphia 76ers', 1610612756: 'Phoenix Suns', 1610612757: 'Portland Trail Blazers',
  1610612758: 'Sacramento Kings', 1610612759: 'San Antonio Spurs', 1610612760: 'Oklahoma City Thunder',
  1610612761: 'Toronto Raptors', 1610612762: 'Utah Jazz', 1610612763: 'Memphis Grizzlies',
  1610612764: 'Washington Wizards', 1610612765: 'Detroit Pistons', 1610612766: 'Charlotte Hornets'
};


const makeKey = (row, cols) => cols.map((c) => String(row?.[c] ?? "")).join("|");

const mergePreferLive = (baseRows = [], liveRows = [], keyCols = []) => {
  const map = new Map();
  for (const r of baseRows) map.set(makeKey(r, keyCols), r);
  for (const r of liveRows) map.set(makeKey(r, keyCols), r); // live overwrites
  return Array.from(map.values());
};

const applyFilters = (q, filters = []) => {
  for (const f of filters) {
    if (f.op === "eq") q = q.eq(f.col, f.val);
    else if (f.op === "in") q = q.in(f.col, f.val);
    else if (f.op === "gte") q = q.gte(f.col, f.val);
    else if (f.op === "lte") q = q.lte(f.col, f.val);
  }
  return q;
};

// returns merged array
const fetchMergedRows = async ({
  baseTable,
  liveTable,
  select = "*",
  filters = [],
  keyCols = [],
}) => {
  const qBase = applyFilters(supabase.from(baseTable).select(select), filters);
  const qLive = applyFilters(supabase.from(liveTable).select(select), filters);

  const [{ data: baseData, error: e1 }, { data: liveData, error: e2 }] =
    await Promise.all([qBase, qLive]);

  // if live table isn't present / errors, fall back to base
  if (e2 && !e1) return baseData || [];
  if (e1 && !e2) return liveData || [];
  if (e1 && e2) return [];

  return mergePreferLive(baseData || [], liveData || [], keyCols);
};

// returns merged single row (or null)
const fetchSingleMerged = async (args) => {
  const rows = await fetchMergedRows(args);
  return rows?.[0] ?? null;
};

// --- component ---
export default function PlayerPage() {
  const { id } = useRouter().query;

  const [playerInfo, setPlayerInfo] = useState(null);
  const [headshotUrl, setHeadshotUrl] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [ageOptions, setAgeOptions] = useState([]);
  const [selectedAge, setSelectedAge] = useState("");
  const [experienceOptions, setExperienceOptions] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState("");
  const [positionSeasons, setPositionSeasons] = useState([]);
  const [selectedPositionSeason, setSelectedPositionSeason] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("All");
  const [selectedExpGroup, setSelectedExpGroup] = useState("All");
  const [selectedPosGroup, setSelectedPosGroup] = useState("All");
  const [selectedSynergySeason, setSelectedSynergySeason] = useState("");
  const [selectedTypeGroup, setSelectedTypeGroup] = useState("Offensive");
  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  const [synergyRows, setSynergyRows] = useState([]);

  const [percentiles, setPercentiles] = useState([]);
  const [agePercentiles, setAgePercentiles] = useState([]);
  const [expPercentiles, setExpPercentiles] = useState([]);
  const [posPercentiles, setPosPercentiles] = useState([]);

  const [shotChartSeason, setShotChartSeason] = useState("");
  const [shotChartBins, setShotChartBins] = useState([]);

  // -------- player info (no live version needed unless you created one)
  useEffect(() => {
    if (!id) return;

    const fetchPlayerData = async () => {
      const { data: player } = await supabase
        .from("players")
        .select("*")
        .eq("player_id", id)
        .single();

      const { data: headshot } = await supabase
        .from("player_headshots")
        .select("headshot")
        .eq("player_id", id)
        .single();

      setPlayerInfo(player);
      setHeadshotUrl(headshot?.headshot);
    };

    fetchPlayerData();
  }, [id]);

  // -------- options (seasons/age/exp/pos seasons + synergy rows) - now merged
  useEffect(() => {
    if (!id || !playerInfo) return;

    const guard = ["Guard", "Guard-Forward"].includes(playerInfo.position);
    const wing = ["Forward", "Forward-Guard"].includes(playerInfo.position);
    const positionTable = guard
      ? "guard_percentiles"
      : wing
      ? "wing_percentiles"
      : "forward_percentiles";

    const fetchOptions = async () => {
      const [seasonRows, ageRows, expRows, posRows, synergyData] =
        await Promise.all([
          fetchMergedRows({
            baseTable: "playtype_percentiles",
            liveTable: "live_playtype_percentiles",
            select: "PLAYER_ID, season",
            filters: [{ col: "PLAYER_ID", op: "eq", val: id }],
            keyCols: ["PLAYER_ID", "season"],
          }),
          fetchMergedRows({
            baseTable: "playtype_percentiles_age",
            liveTable: "live_playtype_percentiles_age",
            select: "PLAYER_ID, age",
            filters: [{ col: "PLAYER_ID", op: "eq", val: id }],
            keyCols: ["PLAYER_ID", "age"],
          }),
          fetchMergedRows({
            baseTable: "playtype_percentiles_exp",
            liveTable: "live_playtype_percentiles_exp",
            select: "PLAYER_ID, experience",
            filters: [{ col: "PLAYER_ID", op: "eq", val: id }],
            keyCols: ["PLAYER_ID", "experience"],
          }),
          fetchMergedRows({
            baseTable: positionTable,
            liveTable: `live_${positionTable}`,
            select: "PLAYER_ID, season",
            filters: [{ col: "PLAYER_ID", op: "eq", val: id }],
            keyCols: ["PLAYER_ID", "season"],
          }),
          fetchMergedRows({
            baseTable: "synergy",
            liveTable: "live_synergy",
            select: "*",
            filters: [{ col: "PLAYER_ID", op: "eq", val: id }],
            // adjust PLAY_TYPE if your column name differs
            keyCols: ["PLAYER_ID", "SEASON", "TEAM_ID", "PLAY_TYPE"],
          }),
        ]);

      const getUnique = (arr, key) =>
        arr ? [...new Set(arr.map((row) => row[key]))].sort() : [];

      const seasons = getUnique(seasonRows, "season");
      const ages = getUnique(ageRows, "age");
      const experiences = getUnique(expRows, "experience");
      const positionSeasons = getUnique(posRows, "season");

      const synergySeasons = getUnique(synergyData, "SEASON");
      const teamIds = getUnique(synergyData, "TEAM_ID");

      setTeamOptions(teamIds);
      setSelectedTeam(teamIds?.[0] ?? "");

      setSeasons(seasons);
      setSelectedSeason(seasons?.[0] ?? "");

      setAgeOptions(ages);
      setSelectedAge(ages?.[0] ?? "");

      setExperienceOptions(experiences);
      setSelectedExperience(experiences?.[0] ?? "");

      setPositionSeasons(positionSeasons);
      setSelectedPositionSeason(positionSeasons?.[0] ?? "");

      setSynergyRows(synergyData || []);
      setSelectedSynergySeason(synergySeasons?.[0] ?? "");

      setShotChartSeason(seasons?.[0] ?? "");
    };

    fetchOptions();
  }, [id, playerInfo]);

  // -------- season percentiles + values (merged)
  useEffect(() => {
    if (!id || !selectedSeason) return;

    const fetchMergedStats = async () => {
      const pct = await fetchSingleMerged({
        baseTable: "playtype_percentiles",
        liveTable: "live_playtype_percentiles",
        select: "*",
        filters: [
          { col: "PLAYER_ID", op: "eq", val: id },
          { col: "season", op: "eq", val: selectedSeason },
        ],
        keyCols: ["PLAYER_ID", "season"],
      });

      const raw = await fetchSingleMerged({
        baseTable: "playtype_values",
        liveTable: "live_playtype_values",
        select: "*",
        filters: [
          { col: "PLAYER_ID", op: "eq", val: id },
          { col: "season", op: "eq", val: selectedSeason },
        ],
        keyCols: ["PLAYER_ID", "season"],
      });

      const merged = Object.entries(pct || {})
        .filter(([key]) => !["PLAYER_ID", "PLAYER_NAME", "TEAM_ID", "season"].includes(key))
        .map(([key, val]) => ({
          stat_name: key,
          percentile: val,
          raw_value: raw?.[key.replace("_pct", "")],
        }));

      setPercentiles(merged);
    };

    fetchMergedStats();
  }, [id, selectedSeason]);

  // -------- age percentiles + values (merged)
  useEffect(() => {
    if (!id || !selectedAge || !selectedSeason) return;

    const fetchMergedStats = async () => {
      const pct = await fetchSingleMerged({
        baseTable: "playtype_percentiles_age",
        liveTable: "live_playtype_percentiles_age",
        select: "*",
        filters: [
          { col: "PLAYER_ID", op: "eq", val: id },
          { col: "age", op: "eq", val: selectedAge },
        ],
        keyCols: ["PLAYER_ID", "age"],
      });

      const raw = await fetchSingleMerged({
        baseTable: "playtype_values",
        liveTable: "live_playtype_values",
        select: "*",
        filters: [
          { col: "PLAYER_ID", op: "eq", val: id },
          { col: "season", op: "eq", val: selectedSeason },
        ],
        keyCols: ["PLAYER_ID", "season"],
      });

      const merged = Object.entries(pct || {})
        .filter(([key]) =>
          !["PLAYER_ID", "PLAYER_NAME", "TEAM_ID", "season", "age"].includes(key)
        )
        .map(([key, val]) => ({
          stat_name: key,
          percentile: val,
          raw_value: raw?.[key.replace("_pct", "")],
        }));

      setAgePercentiles(merged);
    };

    fetchMergedStats();
  }, [id, selectedAge, selectedSeason]);

  // -------- experience percentiles + values (merged)
  useEffect(() => {
    if (!id || !selectedExperience || !selectedSeason) return;

    const fetchMergedStats = async () => {
      const pct = await fetchSingleMerged({
        baseTable: "playtype_percentiles_exp",
        liveTable: "live_playtype_percentiles_exp",
        select: "*",
        filters: [
          { col: "PLAYER_ID", op: "eq", val: id },
          { col: "experience", op: "eq", val: selectedExperience },
        ],
        keyCols: ["PLAYER_ID", "experience"],
      });

      const raw = await fetchSingleMerged({
        baseTable: "playtype_values",
        liveTable: "live_playtype_values",
        select: "*",
        filters: [
          { col: "PLAYER_ID", op: "eq", val: id },
          { col: "season", op: "eq", val: selectedSeason },
        ],
        keyCols: ["PLAYER_ID", "season"],
      });

      const merged = Object.entries(pct || {})
        .filter(([key]) =>
          !["PLAYER_ID", "PLAYER_NAME", "TEAM_ID", "season", "experience"].includes(key)
        )
        .map(([key, val]) => ({
          stat_name: key,
          percentile: val,
          raw_value: raw?.[key.replace("_pct", "")],
        }));

      setExpPercentiles(merged);
    };

    fetchMergedStats();
  }, [id, selectedExperience, selectedSeason]);

  // -------- position percentiles + values (merged)
  useEffect(() => {
    if (!id || !selectedPositionSeason || !playerInfo || !selectedSeason) return;

    const guard = ["Guard", "Guard-Forward"].includes(playerInfo.position);
    const wing = ["Forward", "Forward-Guard"].includes(playerInfo.position);
    const positionTable = guard
      ? "guard_percentiles"
      : wing
      ? "wing_percentiles"
      : "forward_percentiles";

    const fetchMergedStats = async () => {
      const pct = await fetchSingleMerged({
        baseTable: positionTable,
        liveTable: `live_${positionTable}`,
        select: "*",
        filters: [
          { col: "PLAYER_ID", op: "eq", val: id },
          { col: "season", op: "eq", val: selectedPositionSeason },
        ],
        keyCols: ["PLAYER_ID", "season"],
      });

      const raw = await fetchSingleMerged({
        baseTable: "playtype_values",
        liveTable: "live_playtype_values",
        select: "*",
        filters: [
          { col: "PLAYER_ID", op: "eq", val: id },
          { col: "season", op: "eq", val: selectedSeason },
        ],
        keyCols: ["PLAYER_ID", "season"],
      });

      const merged = Object.entries(pct || {})
        .filter(([key]) =>
          !["PLAYER_ID", "PLAYER_NAME", "TEAM_ID", "season", "position"].includes(key)
        )
        .map(([key, val]) => ({
          stat_name: key,
          percentile: val,
          raw_value: raw?.[key.replace("_pct", "")],
        }));

      setPosPercentiles(merged);
    };

    fetchMergedStats();
  }, [id, selectedPositionSeason, selectedSeason, playerInfo]);

  useEffect(() => {
  if (!id || !shotChartSeason) return;

  const fetchShotChart = async () => {
    const { data, error } = await supabase
      .from('player_shot_bins')
      .select('*')
      .eq('PLAYER_ID', id)
      .eq('SEASON', shotChartSeason);

    if (!error) setShotChartBins(data);
  };

  fetchShotChart();
  }, [id, shotChartSeason]);


  return (
    <div className="p-6">
      {playerInfo && (
        <div className="flex items-center mb-8 gap-6">
          <img
            src={headshotUrl || '/default-headshot.png'}
            alt={playerInfo.player_name}
            className="w-24 h-24 rounded-full object-cover border"
          />
          <div>
            <h2 className="text-2xl font-bold">{playerInfo.player_name}</h2>
            <p><strong>Position:</strong> {playerInfo.position}</p>
            <p><strong>Height / Weight:</strong> {playerInfo.height}, {playerInfo.weight} lbs</p>
            <p><strong>School:</strong> {playerInfo.school || 'N/A'}</p>
            <p><strong>Born:</strong> {new Date(playerInfo.birthdate).toLocaleDateString()}</p>
            <p><strong>Drafted:</strong> {playerInfo.draft_year} – Round {playerInfo.draft_round}, Pick {playerInfo.draft_number}</p>
          </div>
        </div>
      )}
      {/* Synergy Percentiles Visual */}
      <div className="flex flex-row justify-between gap-10">
        {/* Synergy Percentiles Block - LEFT */}
        <div className="flex-1">
          <div className="mb-4 flex gap-4 items-center">
            <label className="font-semibold">PlayType Season:</label>
            <select
              value={selectedSynergySeason}
              onChange={(e) => setSelectedSynergySeason(e.target.value)}
              className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[...new Set(synergyRows.map(r => r.SEASON))].map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>

            <label className="font-semibold ml-6">Type Group:</label>
            <select
              value={selectedTypeGroup}
              onChange={(e) => setSelectedTypeGroup(e.target.value)}
              className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="offensive">Offensive</option>
              <option value="defensive">Defensive</option>
            </select>

            <label className="font-semibold ml-6">Team:</label>
            <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
              {teamOptions.map(teamId => (
                <option key={teamId} value={teamId}>
                  {teamIdToName[teamId] || teamId}
                </option>
              ))}
            </select>
          </div>

          {synergyRows
            .filter(r => r.SEASON === selectedSynergySeason && r.TYPE_GROUPING === selectedTypeGroup  &&  r.TEAM_ID === parseInt(selectedTeam))
            .map(row => (
              <PercentileSlider2
                key={row.PLAY_TYPE}
                label={row.PLAY_TYPE}
                ppp={row.PPP}
                percentiles={[
                  row.PERCENTILE,
                  row.PPP_pct_by_age,
                  row.PPP_pct_by_experience,
                  row.PPP_pct_by_position_group
                ]}
              />
            ))}
        </div>

        {/* Shot Chart Block - RIGHT */}
        <div className="flex-1">
          <div className="mb-3">
            <label className="font-semibold">Shot Chart Season:</label>
            <select
              value={shotChartSeason}
              onChange={(e) => setShotChartSeason(e.target.value)}
              className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {seasons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {shotChartBins.length > 0 ? (
            <ShotChart bins={shotChartBins} playerName={playerInfo?.player_name} />
          ) : (
            <p className="text-sm text-gray-500">No shot data available for this season.</p>
          )}
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="mr-2 font-semibold">Season:</label>
          <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Select --</option>
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Age:</label>
          <select value={selectedAge} onChange={(e) => setSelectedAge(e.target.value)} className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Select --</option>
            {ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Experience:</label>
          <select value={selectedExperience} onChange={(e) => setSelectedExperience(e.target.value)} className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Select --</option>
            {experienceOptions.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Position Season:</label>
          <select value={selectedPositionSeason} onChange={(e) => setSelectedPositionSeason(e.target.value)} className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Select --</option>
            {positionSeasons.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[{
          label: 'Main Stats', data: percentiles, group: selectedGroup, setGroup: setSelectedGroup
        }, {
          label: `Age (${selectedAge})`, data: agePercentiles, group: selectedAgeGroup, setGroup: setSelectedAgeGroup
        }, {
          label:  `Experience (${selectedExperience})`, data: expPercentiles, group: selectedExpGroup, setGroup: setSelectedExpGroup
        }, {
          label: `Position (${playerInfo?.position})`, data: posPercentiles, group: selectedPosGroup, setGroup: setSelectedPosGroup
        }].map(({ label, data, group, setGroup }) => (
          <div key={label}>
            <h3 className="font-semibold mb-2">{label}</h3>
            <select
              className="bg-white text-black border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              {Object.keys(statGroups).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {data.filter(item => statGroups[group].includes(item.stat_name)).map(item => (
              <PercentileSlider
                key={`${item.stat_name}-${label}`}
                label={statNameMap[item.stat_name] || item.stat_name}
                value={item.percentile * 100}
                raw={item.raw_value}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
