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
    // A team can never play a team from the same country
    nationalities[t.id][t.country] = 2;
  });

  return { playedHome, playedAway, nationalities };
}

// When a match (home, away) is drawn, update the constraints accordingly.
// Returns a new Constraints object (immutable update for React state).
export function updateConstraints(
  constraints: Constraints,
  home: Team,
  away: Team,
): Constraints {
  const newConstraints: Constraints = structuredClone(constraints);

  // Guard against duplicates
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

// Helper: checks if opponent_team passes the cheap pre-admissibility filter
// (no solver call — purely constraint-based)
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

// Returns all pre-admissible (home, away) couples for the given team and pot.
// If the home or away match for this pot is already decided (drawn earlier when
// an opponent team was processed), that fixed opponent is used directly.
// Constraints are NEVER updated here — read-only.
export function preadmissibleOpponentCouples(
  team: Team,
  opponentPotIndex: number,
  constraints: Constraints,
): { home: Team; away: Team }[] {
  const potTeams = POTS[opponentPotIndex as keyof typeof POTS];

  // Check whether a home or away match from this pot is already recorded.
  // IMPORTANT: use !== undefined (not truthiness) because id=0 is falsy.
  const existingHomeId = constraints.playedHome[team.id].find(
    (id) => TEAMS[id]?.pot === opponentPotIndex,
  );
  const existingAwayId = constraints.playedAway[team.id].find(
    (id) => TEAMS[id]?.pot === opponentPotIndex,
  );

  const existingHome =
    existingHomeId !== undefined ? TEAMS[existingHomeId] : undefined;
  const existingAway =
    existingAwayId !== undefined ? TEAMS[existingAwayId] : undefined;

  // Both already fixed → return the single decided pair immediately
  if (existingHome !== undefined && existingAway !== undefined) {
    return [{ home: existingHome, away: existingAway }];
  }

  // Build candidate lists, locking in any already-fixed side
  const homeCandidates: Team[] =
    existingHome !== undefined
      ? [existingHome]
      : potTeams.filter((t) => isPreAdmissibleOpponent(team, t, constraints));

  const awayCandidates: Team[] =
    existingAway !== undefined
      ? [existingAway]
      : potTeams.filter((t) => isPreAdmissibleOpponent(team, t, constraints));

  // Build all valid (home, away) pairs
  const couples: { home: Team; away: Team }[] = [];
  for (const h of homeCandidates) {
    for (const a of awayCandidates) {
      if (h.id === a.id) continue; // home and away must be different teams
      couples.push({ home: h, away: a });
    }
  }

  return couples;
}

// Finds a feasible (home, away) pair for team from opponentPotIndex.
// Used standalone (outside the UI solver loop) if needed.
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
  const shuffled = [...couples].sort(() => Math.random() - 0.5);

  for (const { home, away } of shuffled) {
    const isFeasible = await solveProblem(team, constraints, { home, away });
    if (isFeasible) return { home, away };
  }

  return null;
}
