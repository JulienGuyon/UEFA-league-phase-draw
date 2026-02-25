export interface Team {
  // The id to the rank of the team in the UEFA ranking (0-based)
  id: number;
  name: string;
  country: string;
  elo: number;
  uefa: number;
  pot: number;
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
