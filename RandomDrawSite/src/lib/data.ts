import type { Team } from "./types";

export const TEAMS: Team[] = [
  // Pot 1
  {
    id: 0,
    name: "Real Madrid",
    country: "Spain",
    elo: 1985,
    uefa: 136,
    pot: 0,
  },
  { id: 1, name: "Man City", country: "England", elo: 2057, uefa: 148, pot: 0 },
  { id: 2, name: "Bayern", country: "Germany", elo: 1904, uefa: 144, pot: 0 },
  { id: 3, name: "PSG", country: "France", elo: 1893, uefa: 116, pot: 0 },
  {
    id: 4,
    name: "Liverpool",
    country: "England",
    elo: 1908,
    uefa: 114,
    pot: 0,
  },
  { id: 5, name: "Inter", country: "Italy", elo: 1960, uefa: 101, pot: 0 },
  { id: 6, name: "Dortmund", country: "Germany", elo: 1874, uefa: 97, pot: 0 },
  { id: 7, name: "Leipzig", country: "Germany", elo: 1849, uefa: 97, pot: 0 },
  { id: 8, name: "Barcelona", country: "Spain", elo: 1894, uefa: 91, pot: 0 },

  // Pot 2
  {
    id: 9,
    name: "Leverkusen",
    country: "Germany",
    elo: 1929,
    uefa: 90,
    pot: 1,
  },
  { id: 10, name: "Atlético", country: "Spain", elo: 1830, uefa: 89, pot: 1 },
  { id: 11, name: "Atalanta", country: "Italy", elo: 1879, uefa: 81, pot: 1 },
  { id: 12, name: "Juventus", country: "Italy", elo: 1839, uefa: 80, pot: 1 },
  { id: 13, name: "Benfica", country: "Portugal", elo: 1824, uefa: 79, pot: 1 },
  { id: 14, name: "Arsenal", country: "England", elo: 1957, uefa: 72, pot: 1 },
  { id: 15, name: "Brugge", country: "Belgium", elo: 1703, uefa: 64, pot: 1 },
  { id: 16, name: "Shakhtar", country: "Ukraine", elo: 1573, uefa: 63, pot: 1 },
  { id: 17, name: "Milan", country: "Italy", elo: 1821, uefa: 59, pot: 1 },

  // Pot 3
  {
    id: 18,
    name: "Feyenoord",
    country: "Netherlands",
    elo: 1747,
    uefa: 57,
    pot: 2,
  },
  {
    id: 19,
    name: "Sporting",
    country: "Portugal",
    elo: 1824,
    uefa: 54.5,
    pot: 2,
  },
  {
    id: 20,
    name: "Eindhoven",
    country: "Netherlands",
    elo: 1794,
    uefa: 54,
    pot: 2,
  },
  { id: 21, name: "Dinamo", country: "Croatia", elo: 1584, uefa: 50, pot: 2 },
  { id: 22, name: "Salzburg", country: "Austria", elo: 1693, uefa: 50, pot: 2 },
  { id: 23, name: "Lille", country: "France", elo: 1785, uefa: 47, pot: 2 },
  { id: 24, name: "Crvena", country: "Serbia", elo: 1734, uefa: 40, pot: 2 },
  { id: 25, name: "YB", country: "Switzerland", elo: 1566, uefa: 34.5, pot: 2 },
  { id: 26, name: "Celtic", country: "Scotland", elo: 1646, uefa: 32, pot: 2 },

  // Pot 4
  {
    id: 27,
    name: "Bratislava",
    country: "Slovakia",
    elo: 1703,
    uefa: 30.5,
    pot: 3,
  },
  { id: 28, name: "Monaco", country: "France", elo: 1780, uefa: 24, pot: 3 },
  {
    id: 29,
    name: "Sparta",
    country: "Czech Republic",
    elo: 1716,
    uefa: 22.5,
    pot: 3,
  },
  {
    id: 30,
    name: "Aston Villa",
    country: "England",
    elo: 1772,
    uefa: 20.86,
    pot: 3,
  },
  {
    id: 31,
    name: "Bologna",
    country: "Italy",
    elo: 1777,
    uefa: 18.056,
    pot: 3,
  },
  { id: 32, name: "Girona", country: "Spain", elo: 1791, uefa: 17.897, pot: 3 },
  {
    id: 33,
    name: "Stuttgart",
    country: "Germany",
    elo: 1795,
    uefa: 17.324,
    pot: 3,
  },
  {
    id: 34,
    name: "Sturm Graz",
    country: "Austria",
    elo: 1610,
    uefa: 14.5,
    pot: 3,
  },
  { id: 35, name: "Brest", country: "France", elo: 1685, uefa: 13.366, pot: 3 },
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
