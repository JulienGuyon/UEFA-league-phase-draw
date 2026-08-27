import type { Team } from "./types";

// 2026/27 UEFA Champions League league phase participants.
// `id` MUST equal the index in this array (the whole codebase looks teams up
// with TEAMS[id]), and the array MUST stay grouped by pot, nine teams per pot:
// the ILP formulation derives pot membership from contiguous index blocks.
// `rank` is the club's position in the UEFA club coefficient ranking (null when
// unranked), `uefa` its club coefficient.
export const TEAMS: Team[] = [
  // Pot 1
  { id: 0, name: "PSG", country: "France", rank: null, uefa: 132.0, pot: 0 },
  { id: 1, name: "Bayern", country: "Germany", rank: 1, uefa: 147.5, pot: 0 },
  { id: 2, name: "Real Madrid", country: "Spain", rank: 2, uefa: 144.5, pot: 0 },
  { id: 3, name: "Liverpool", country: "England", rank: 4, uefa: 130.0, pot: 0 },
  { id: 4, name: "Inter", country: "Italy", rank: 5, uefa: 127.0, pot: 0 },
  { id: 5, name: "Man City", country: "England", rank: 6, uefa: 125.5, pot: 0 },
  { id: 6, name: "Arsenal", country: "England", rank: 7, uefa: 119.0, pot: 0 },
  { id: 7, name: "Barcelona", country: "Spain", rank: 8, uefa: 113.25, pot: 0 },
  { id: 8, name: "Atlético", country: "Spain", rank: 10, uefa: 104.75, pot: 0 },

  // Pot 2
  { id: 9, name: "Dortmund", country: "Germany", rank: 11, uefa: 100.75, pot: 1 },
  { id: 10, name: "Roma", country: "Italy", rank: 13, uefa: 97.75, pot: 1 },
  { id: 11, name: "Sporting CP", country: "Portugal", rank: 15, uefa: 84.0, pot: 1 },
  { id: 12, name: "Aston Villa", country: "England", rank: 17, uefa: 83.0, pot: 1 },
  { id: 13, name: "Porto", country: "Portugal", rank: 20, uefa: 80.75, pot: 1 },
  { id: 14, name: "Man United", country: "England", rank: 21, uefa: 76.5, pot: 1 },
  { id: 15, name: "Club Brugge", country: "Belgium", rank: 23, uefa: 75.25, pot: 1 },
  { id: 16, name: "Real Betis", country: "Spain", rank: 24, uefa: 74.5, pot: 1 },
  { id: 17, name: "PSV", country: "Netherlands", rank: 26, uefa: 71.25, pot: 1 },

  // Pot 3
  { id: 18, name: "Feyenoord", country: "Netherlands", rank: 27, uefa: 71.0, pot: 2 },
  { id: 19, name: "Lille", country: "France", rank: 29, uefa: 68.75, pot: 2 },
  { id: 20, name: "Bodø/Glimt", country: "Norway", rank: 32, uefa: 64.0, pot: 2 },
  { id: 21, name: "Napoli", country: "Italy", rank: 34, uefa: 63.0, pot: 2 },
  { id: 22, name: "Leipzig", country: "Germany", rank: 37, uefa: 61.0, pot: 2 },
  { id: 23, name: "Villarreal", country: "Spain", rank: 39, uefa: 59.0, pot: 2 },
  { id: 24, name: "Fenerbahçe", country: "Turkey", rank: 42, uefa: 57.75, pot: 2 },
  { id: 25, name: "Shakhtar", country: "Ukraine", rank: 45, uefa: 56.25, pot: 2 },
  { id: 26, name: "Galatasaray", country: "Turkey", rank: 49, uefa: 53.5, pot: 2 },

  // Pot 4
  { id: 27, name: "Slavia Praha", country: "Czech Republic", rank: 59, uefa: 44.0, pot: 3 },
  { id: 28, name: "Slovan", country: "Slovakia", rank: 65, uefa: 36.0, pot: 3 },
  { id: 29, name: "Stuttgart", country: "Germany", rank: 80, uefa: 27.5, pot: 3 },
  { id: 30, name: "AEK Athens", country: "Greece", rank: 84, uefa: 24.0, pot: 3 },
  { id: 31, name: "LASK", country: "Austria", rank: 99, uefa: 21.0, pot: 3 },
  { id: 32, name: "Como", country: "Italy", rank: null, uefa: 19.989, pot: 3 },
  { id: 33, name: "Lens", country: "France", rank: 120, uefa: 16.699, pot: 3 },
  { id: 34, name: "Viking", country: "Norway", rank: 202, uefa: 8.247, pot: 3 },
  { id: 35, name: "Sabah", country: "Azerbaijan", rank: 244, uefa: 6.0, pot: 3 },
];

export const POTS = {
  0: TEAMS.filter((t) => t.pot === 0),
  1: TEAMS.filter((t) => t.pot === 1),
  2: TEAMS.filter((t) => t.pot === 2),
  3: TEAMS.filter((t) => t.pot === 3),
};

export const ALL_NATIONALITIES = Array.from(
  new Set(TEAMS.map((t) => t.country)),
);

export const NB_POTS: number = 4;
export const NB_TEAMS_PER_POT: number = 9;
export const NB_TEAMS: number = TEAMS.length;

console.assert(
  NB_POTS * NB_TEAMS_PER_POT === NB_TEAMS,
  "Number of pots times teams per pot should equal total teams",
);

console.assert(
  TEAMS.every((t, i) => t.id === i && t.pot === Math.floor(i / NB_TEAMS_PER_POT)),
  "TEAMS must be indexed by id and grouped by pot in blocks of NB_TEAMS_PER_POT",
);
