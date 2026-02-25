import type { Team, Constraints } from "./types";
import { TEAMS, POTS } from "./data";
import { solveProblem } from "./solver";

// Initialize the constraints with the initial state of the draw (no matches played)
export function initializeConstraints(): Constraints {
  const playedHome: Record<number, number[]> = {};
  const playedAway: Record<number, number[]> = {};
  const nationalities: Record<number, Record<string, number>> = {};

  TEAMS.forEach((t) => {
    playedHome[t.id] = [];
    playedAway[t.id] = [];
    nationalities[t.id] = {};
    // Security to ensure that a team cannot play against any other
    //  team from the same country
    nationalities[t.id][t.country] = 2;
  });

  return { playedHome, playedAway, nationalities };
}

// When a match (home, away) is drawn, update the constraints accordingly
// We return a new Constraints object to ensure immutability (react state update)
// home receives away
export function updateConstraints(
  constraints: Constraints,
  home: Team,
  away: Team,
): Constraints {
  const newConstraints: Constraints = structuredClone(constraints);

  // Guard against duplicate: if this exact match is already recorded, do not re-add it
  if (!constraints.playedHome[home.id].includes(away.id)) {
    newConstraints.playedHome[home.id].push(away.id);
    newConstraints.nationalities[home.id][away.country] =
      (newConstraints.nationalities[home.id][away.country] ?? 0) + 1;
  }

  if (!constraints.playedAway[away.id].includes(home.id)) {
    newConstraints.playedAway[away.id].push(home.id);
    newConstraints.nationalities[away.id][home.country] =
      (newConstraints.nationalities[away.id][home.country] ?? 0) + 1;
  }

  return newConstraints;
}

// Helper: checks if a team from this pot is a valid opponent for the selected team
const isPreAdmissibleOpponent = (
  selected_team: Team,
  opponent_team: Team,
  constraints: Constraints,
): boolean =>
  opponent_team.id !== selected_team.id &&
  opponent_team.country !== selected_team.country &&
  (constraints.nationalities[selected_team.id][opponent_team.country] ?? 0) <
    2 &&
  (constraints.nationalities[opponent_team.id][selected_team.country] ?? 0) < 2;

// Returns all pre-admissible (home, away) couples for the given team and pot,
// without shuffling. Filters out pairs that violate hard constraints directly
// derivable from the constraints object, without calling the solver.
export function preadmissibleOpponentCouples(
  team: Team,
  opponentPotIndex: number,
  constraints: Constraints,
): { home: Team; away: Team }[] {
  const potTeams = POTS[opponentPotIndex as keyof typeof POTS];

  // Check if there is already a home or away match drawn for this team in this pot
  const existingHomeId = constraints.playedHome[team.id].find(
    (opponentId) =>
      TEAMS.find((t) => t.id === opponentId)?.pot === opponentPotIndex,
  );
  const existingAwayId = constraints.playedAway[team.id].find(
    (opponentId) =>
      TEAMS.find((t) => t.id === opponentId)?.pot === opponentPotIndex,
  );

  const existingHome = existingHomeId
    ? TEAMS.find((t) => t.id === existingHomeId)
    : undefined;
  const existingAway = existingAwayId
    ? TEAMS.find((t) => t.id === existingAwayId)
    : undefined;

  // If both are already fixed, return the single pair directly
  if (existingHome && existingAway) {
    return [{ home: existingHome, away: existingAway }];
  }

  // Otherwise, build the candidate lists for home and away opponents
  const homeCandidates: Team[] = existingHome
    ? [existingHome]
    : potTeams.filter((t) => isPreAdmissibleOpponent(team, t, constraints));

  const awayCandidates: Team[] = existingAway
    ? [existingAway]
    : potTeams.filter((t) => isPreAdmissibleOpponent(team, t, constraints));

  // Build all valid (home, away) pairs
  const couples: { home: Team; away: Team }[] = [];

  for (const h of homeCandidates) {
    for (const a of awayCandidates) {
      // Home and away opponent must be different teams
      if (h.id === a.id) continue;

      //   // If both opponents share a nationality, team would face 2 matches
      //   // against that nationality at once — only allowed if no match against
      //   // that nationality has been played yet
      //   if (h.country === a.country) {
      //     if ((constraints.nationalities[team.id][h.country] ?? 0) > 0) continue;
      //   }

      couples.push({ home: h, away: a });
    }
  }

  return couples;
}

// select team receives home and play away against away team
export async function findOpponentsForTeam(
  team: Team,
  opponentPotIndex: number,
  constraints: Constraints,
): Promise<{ home: Team; away: Team } | null> {
  const couples = preadmissibleOpponentCouples(
    team,
    opponentPotIndex,
    constraints,
  );

  // Shuffle the candidates to ensure randomness in the draw
  const shuffled = [...couples].sort(() => Math.random() - 0.5);

  for (const { home, away } of shuffled) {
    const isFeasible = await solveProblem(team, constraints, { home, away });
    if (isFeasible) {
      return { home, away };
    }
  }

  return null;
}
