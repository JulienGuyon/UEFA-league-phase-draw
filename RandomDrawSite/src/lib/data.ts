import type { Competition, CompetitionId, Team } from "./types";

export const NB_POTS = 4;
export const NB_TEAMS_PER_POT = 9;
export const NB_TEAMS = NB_POTS * NB_TEAMS_PER_POT;

// A team as written in the tables below: `id` and `pot` are derived from the
// position in the list, so they can't drift out of sync with it.
type TeamEntry = Omit<Team, "id" | "pot">;

// Builds a competition from a flat, pot-ordered list of 36 teams.
//
// The invariants enforced here are load-bearing, not cosmetic: every lookup in
// the app is `competition.teams[id]`, and the ILP formulation derives pot
// membership from contiguous index blocks of NB_TEAMS_PER_POT. A list that is
// mis-ordered or the wrong length would produce a silently wrong draw rather
// than an error, so we fail loudly at module load instead.
function buildCompetition(
  meta: Pick<Competition, "id" | "name" | "shortName" | "season" | "accent">,
  entries: TeamEntry[],
): Competition {
  if (entries.length !== NB_TEAMS) {
    throw new Error(
      `${meta.id}: expected ${NB_TEAMS} teams, got ${entries.length}`,
    );
  }

  const teams: Team[] = entries.map((entry, index) => ({
    ...entry,
    id: index,
    pot: Math.floor(index / NB_TEAMS_PER_POT),
  }));

  const pots = Array.from({ length: NB_POTS }, (_, pot) =>
    teams.filter((t) => t.pot === pot),
  );

  // A pot holding two teams of the same country is legal; a pot of the wrong
  // size is not, and would break the "one home + one away per pot" constraint.
  for (const [i, pot] of pots.entries()) {
    if (pot.length !== NB_TEAMS_PER_POT) {
      throw new Error(
        `${meta.id}: pot ${i + 1} has ${pot.length} teams, expected ${NB_TEAMS_PER_POT}`,
      );
    }
  }

  return {
    ...meta,
    teams,
    pots,
    nationalities: Array.from(new Set(teams.map((t) => t.country))),
  };
}

// ─── 2026/27 UEFA Champions League ────────────────────────────────────────────

export const CHAMPIONS_LEAGUE = buildCompetition(
  {
    id: "ucl",
    name: "Champions League",
    shortName: "UCL",
    season: "2026/27",
    accent: "var(--uefa-blue)",
  },
  [
    // Pot 1
    { name: "PSG", country: "France", rank: null, uefa: 132.0 },
    { name: "Bayern", country: "Germany", rank: 1, uefa: 147.5 },
    { name: "Real Madrid", country: "Spain", rank: 2, uefa: 144.5 },
    { name: "Liverpool", country: "England", rank: 4, uefa: 130.0 },
    { name: "Inter", country: "Italy", rank: 5, uefa: 127.0 },
    { name: "Man City", country: "England", rank: 6, uefa: 125.5 },
    { name: "Arsenal", country: "England", rank: 7, uefa: 119.0 },
    { name: "Barcelona", country: "Spain", rank: 8, uefa: 113.25 },
    { name: "Atlético", country: "Spain", rank: 10, uefa: 104.75 },

    // Pot 2
    { name: "Dortmund", country: "Germany", rank: 11, uefa: 100.75 },
    { name: "Roma", country: "Italy", rank: 13, uefa: 97.75 },
    { name: "Sporting CP", country: "Portugal", rank: 15, uefa: 84.0 },
    { name: "Aston Villa", country: "England", rank: 17, uefa: 83.0 },
    { name: "Porto", country: "Portugal", rank: 20, uefa: 80.75 },
    { name: "Man United", country: "England", rank: 21, uefa: 76.5 },
    { name: "Club Brugge", country: "Belgium", rank: 23, uefa: 75.25 },
    { name: "Real Betis", country: "Spain", rank: 24, uefa: 74.5 },
    { name: "PSV", country: "Netherlands", rank: 26, uefa: 71.25 },

    // Pot 3
    { name: "Feyenoord", country: "Netherlands", rank: 27, uefa: 71.0 },
    { name: "Lille", country: "France", rank: 29, uefa: 68.75 },
    { name: "Bodø/Glimt", country: "Norway", rank: 32, uefa: 64.0 },
    { name: "Napoli", country: "Italy", rank: 34, uefa: 63.0 },
    { name: "Leipzig", country: "Germany", rank: 37, uefa: 61.0 },
    { name: "Villarreal", country: "Spain", rank: 39, uefa: 59.0 },
    { name: "Fenerbahçe", country: "Turkey", rank: 42, uefa: 57.75 },
    { name: "Shakhtar", country: "Ukraine", rank: 45, uefa: 56.25 },
    { name: "Galatasaray", country: "Turkey", rank: 49, uefa: 53.5 },

    // Pot 4
    { name: "Slavia Praha", country: "Czech Republic", rank: 59, uefa: 44.0 },
    { name: "Slovan", country: "Slovakia", rank: 65, uefa: 36.0 },
    { name: "Stuttgart", country: "Germany", rank: 80, uefa: 27.5 },
    { name: "AEK Athens", country: "Greece", rank: 84, uefa: 24.0 },
    { name: "LASK", country: "Austria", rank: 99, uefa: 21.0 },
    { name: "Como", country: "Italy", rank: null, uefa: 19.989 },
    { name: "Lens", country: "France", rank: 120, uefa: 16.699 },
    { name: "Viking", country: "Norway", rank: 202, uefa: 8.247 },
    { name: "Sabah", country: "Azerbaijan", rank: 244, uefa: 6.0 },
  ],
);

// ─── 2026/27 UEFA Europa League ───────────────────────────────────────────────

export const EUROPA_LEAGUE = buildCompetition(
  {
    id: "uel",
    name: "Europa League",
    shortName: "UEL",
    season: "2026/27",
    accent: "var(--uefa-orange)",
  },
  [
    // Pot 1
    { name: "Leverkusen", country: "Germany", rank: 9, uefa: 105.0 },
    { name: "Benfica", country: "Portugal", rank: 14, uefa: 90.0 },
    { name: "Juventus", country: "Italy", rank: 25, uefa: 72.25 },
    { name: "Milan", country: "Italy", rank: 30, uefa: 66.0 },
    { name: "Lyon", country: "France", rank: 31, uefa: 65.75 },
    { name: "AZ", country: "Netherlands", rank: 35, uefa: 62.875 },
    { name: "Olympiacos", country: "Greece", rank: 36, uefa: 62.25 },
    { name: "Real Sociedad", country: "Spain", rank: 43, uefa: 57.0 },
    { name: "Marseille", country: "France", rank: 48, uefa: 54.0 },

    // Pot 2
    { name: "Ferencváros", country: "Hungary", rank: 50, uefa: 51.25 },
    { name: "Viktoria Plzeň", country: "Czech Republic", rank: 51, uefa: 50.5 },
    { name: "Union SG", country: "Belgium", rank: 54, uefa: 48.0 },
    { name: "Dinamo Zagreb", country: "Croatia", rank: 56, uefa: 46.5 },
    { name: "Salzburg", country: "Austria", rank: 57, uefa: 45.0 },
    { name: "Celtic", country: "Scotland", rank: 58, uefa: 44.0 },
    { name: "Sparta Praha", country: "Czech Republic", rank: 64, uefa: 38.25 },
    { name: "Rennes", country: "France", rank: 66, uefa: 35.0 },
    { name: "Anderlecht", country: "Belgium", rank: 72, uefa: 30.75 },

    // Pot 3
    { name: "Sturm Graz", country: "Austria", rank: 79, uefa: 28.0 },
    { name: "Lech Poznań", country: "Poland", rank: 81, uefa: 27.25 },
    { name: "Crystal Palace", country: "England", rank: 86, uefa: 23.903 },
    { name: "Bournemouth", country: "England", rank: null, uefa: 23.903 },
    { name: "Sunderland", country: "England", rank: null, uefa: 23.903 },
    { name: "Celje", country: "Slovenia", rank: 89, uefa: 23.0 },
    { name: "Jagiellonia", country: "Poland", rank: 93, uefa: 22.0 },
    { name: "Omonia", country: "Cyprus", rank: 97, uefa: 21.25 },
    { name: "Celta Vigo", country: "Spain", rank: 104, uefa: 19.409 },

    // Pot 4
    { name: "Hoffenheim", country: "Germany", rank: 112, uefa: 18.58 },
    { name: "Beşiktaş", country: "Turkey", rank: 123, uefa: 15.5 },
    { name: "Torreense", country: "Portugal", rank: null, uefa: 14.633 },
    { name: "H. Be'er Sheva", country: "Israel", rank: 132, uefa: 14.0 },
    { name: "NEC", country: "Netherlands", rank: null, uefa: 13.585 },
    { name: "OFI", country: "Greece", rank: null, uefa: 9.682 },
    { name: "Lillestrøm", country: "Norway", rank: 204, uefa: 8.427 },
    { name: "Levski Sofia", country: "Bulgaria", rank: 222, uefa: 7.0 },
    { name: "Ararat-Armenia", country: "Armenia", rank: 224, uefa: 7.0 },
  ],
);

export const COMPETITIONS: Competition[] = [CHAMPIONS_LEAGUE, EUROPA_LEAGUE];

export const DEFAULT_COMPETITION_ID: CompetitionId = CHAMPIONS_LEAGUE.id;
