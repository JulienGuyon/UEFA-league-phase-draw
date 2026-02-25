import type { Team, Constraints } from "./types";
import { TEAMS, ALL_NATIONALITIES, NB_TEAMS, NB_TEAMS_PER_POT } from "./data";

let highs: any = null;
let highsPromise: Promise<any> | null = null;

// This function initializes the HiGHS solver from Webassembly module
export async function initSolver() {
  if (highs) return highs;
  if (highsPromise) return highsPromise;

  if (typeof window === "undefined") return null;

  highsPromise = (async () => {
    try {
      //@ts-ignore
      const highsModule: any = await import("highs");
      const highsLoader: any = highsModule.default ?? highsModule;

      highs = await highsLoader({
        locateFile: (file: string) =>
          `https://lovasoa.github.io/highs-js/${file}`,
      });

      return highs;
    } catch (e) {
      console.error("Failed to load HiGHS solver:", e);
      highsPromise = null;
      throw e;
    }
  })();

  return highsPromise;
}

export async function solveProblem(
  selectedTeam: Team,
  constraints: Constraints,
  candidateMatch: { home: Team; away: Team },
): Promise<boolean> {
  const solver = await initSolver();
  if (!solver) throw new Error("Solver not initialized");

  // x_i_j = 1 if team i plays at home against team j, 0 otherwise
  const x = (i: number, j: number) => `x_${i}_${j}`;

  let problem_string = "Maximize\n obj: 0\nSubject To\n";
  let constraintCount = 0;

  // A team cannot play against itself
  for (let i = 0; i < NB_TEAMS; i++) {
    problem_string += ` c${constraintCount++}: ${x(i, i)} = 0\n`;
  }

  // Each team must play exactly 1 home game and 1 away game against each pot
  for (let i = 0; i < NB_TEAMS; i++) {
    for (
      let potStart = 0;
      potStart <= NB_TEAMS - NB_TEAMS_PER_POT;
      potStart += NB_TEAMS_PER_POT
    ) {
      const homeTerms = Array.from({ length: NB_TEAMS_PER_POT }, (_, k) =>
        x(i, potStart + k),
      );
      problem_string += ` c${constraintCount++}: ${homeTerms.join(" + ")} = 1\n`;

      const awayTerms = Array.from({ length: NB_TEAMS_PER_POT }, (_, k) =>
        x(potStart + k, i),
      );
      problem_string += ` c${constraintCount++}: ${awayTerms.join(" + ")} = 1\n`;
    }
  }

  // At most 2 matches (home + away combined) against teams of the same nationality
  for (const nat of ALL_NATIONALITIES) {
    for (let i = 0; i < NB_TEAMS; i++) {
      const natTerms: string[] = [];
      for (let j = 0; j < NB_TEAMS; j++) {
        if (i === j) continue;
        if (TEAMS[j].country === nat) {
          natTerms.push(x(i, j), x(j, i));
        }
      }
      if (natTerms.length > 0) {
        problem_string += ` c${constraintCount++}: ${natTerms.join(" + ")} <= 2\n`;
      }
    }
  }

  // Same nationality teams cannot play each other
  for (let i = 0; i < NB_TEAMS; i++) {
    for (let j = 0; j < NB_TEAMS; j++) {
      if (i === j) continue;
      if (TEAMS[i].country === TEAMS[j].country) {
        problem_string += ` c${constraintCount++}: ${x(i, j)} = 0\n`;
      }
    }
  }

  // Already played home matches
  for (let teamId = 0; teamId < NB_TEAMS; teamId++) {
    for (const oppId of constraints.playedHome[teamId] || []) {
      problem_string += ` c${constraintCount++}: ${x(teamId, oppId)} = 1\n`;
    }
  }

  // Already played away matches
  for (let teamId = 0; teamId < NB_TEAMS; teamId++) {
    for (const oppId of constraints.playedAway[teamId] || []) {
      problem_string += ` c${constraintCount++}: ${x(oppId, teamId)} = 1\n`;
    }
  }

  // Add the candidate matches for the selected team
  problem_string += ` c${constraintCount++}: ${x(selectedTeam.id, candidateMatch.home.id)} = 1\n`;
  problem_string += ` c${constraintCount++}: ${x(candidateMatch.away.id, selectedTeam.id)} = 1\n`;

  // All variables are binary
  let binaries = "Binary\n";
  for (let i = 0; i < NB_TEAMS; i++) {
    for (let j = 0; j < NB_TEAMS; j++) {
      binaries += ` ${x(i, j)}\n`;
    }
  }

  problem_string += binaries + "End";

  try {
    const solution = solver.solve(problem_string);
    return solution.Status === "Optimal";
  } catch (e) {
    console.error("Solver error:", e);
    return false;
  }
}
