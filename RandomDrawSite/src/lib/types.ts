export interface Team {
  // Index of the team within its own competition's `teams` array — teams are
  // looked up with competition.teams[id], so this must match the array position.
  // Ids are only unique inside a competition: UCL team 0 and UEL team 0 are
  // different clubs, so never mix ids coming from two competitions.
  id: number;
  name: string;
  country: string;
  // Position in the UEFA club coefficient ranking, null when unranked.
  rank: number | null;
  // UEFA club coefficient.
  uefa: number;
  pot: number;
}

export type CompetitionId = "ucl" | "uel";

// A league phase to draw. Both UEFA competitions share the exact same format
// (36 teams, 4 pots of 9, 8 matches, identical association constraints), so the
// whole draw pipeline is written against this rather than a fixed team list.
export interface Competition {
  id: CompetitionId;
  // Full name, e.g. "Champions League".
  name: string;
  // Compact label for tight spots, e.g. "UCL".
  shortName: string;
  // Season the team list describes, e.g. "2026/27".
  season: string;
  // Brand colour used to tell the two competitions apart in the UI.
  accent: string;
  teams: Team[];
  // pots[i] holds the nine teams of pot i+1, in `teams` order.
  pots: Team[][];
  // Every distinct country present, used by the association constraints.
  nationalities: string[];
}

export interface Match {
  home: Team;
  away: Team;
}

export interface DrawState {
  currentPot: number;
  currentTeam: Team | null;
  drawnTeams: number[];
  matches: Match[];
  constraints: Constraints;
  isDrawing: boolean;
  isFinished: boolean;
  logs: string[];
}

// playedHome[teamId] = [opponentId1, opponentId2, ...] means that teamId has played at home against opponentId1, opponentId2, etc.
// playedAway[teamId] = [opponentId1, opponentId2, ...] means that teamId has played away against opponentId1, opponentId2, etc.
// nationalities[teamId][country] = n means that teamId has played n times against teams from country
export interface Constraints {
  playedHome: Record<number, number[]>;
  playedAway: Record<number, number[]>;
  nationalities: Record<number, Record<string, number>>;
}

export type Pot = Team[];
