import type { Team, Constraints } from "./types";
import { TEAMS, ALL_NATIONALITIES, NB_TEAMS, NB_TEAMS_PER_POT } from "./data";

let highs: any = null;
let highsPromise: Promise<any> | null = null;

// ─── Solver init ──────────────────────────────────────────────────────────────

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

// ─── Problem formulation ──────────────────────────────────────────────────────
//
// Mirrors the Julia solve_problem() formulation exactly.
//
// Variables: x_i_j_t ∈ {0,1}
//   = 1 if team i plays at home against team j on matchday t
//
// T = 8 matchdays, 36 teams, 4 pots of 9 teams each.
//
// Constraints (in order, matching Julia):
//   1. A team cannot play against itself:
//        ∑_t x_i_i_t = 0  ∀i
//
//   2. Each ordered pair (i,j) with i≠j plays at most once across all matchdays:
//        ∑_t (x_i_j_t + x_j_i_t) ≤ 1  ∀i≠j
//
//   3. Each team plays exactly 1 home and 1 away match against each pot:
//        ∑_t ∑_{j in pot} x_i_j_t = 1  ∀i, ∀pot
//        ∑_t ∑_{j in pot} x_j_i_t = 1  ∀i, ∀pot
//
//   4. Candidate match for selected team (the pair being tested):
//        ∑_t x_selectedTeam_home_t = 1
//        ∑_t x_away_selectedTeam_t = 1
//
//   5. Already-drawn home matches:
//        ∑_t x_teamId_oppId_t = 1  for each (teamId, oppId) in playedHome
//
//   6. Already-drawn away matches:
//        ∑_t x_oppId_teamId_t = 1  for each (teamId, oppId) in playedAway
//
//   7. Same-nationality teams cannot play each other:
//        ∑_t x_i_j_t = 0  ∀i≠j where country(i) == country(j)
//
//   8. At most 2 matches (home + away) against teams of any one nationality:
//        ∑_t ∑_{j: country(j)==nat} (x_i_j_t + x_j_i_t) ≤ 2  ∀i, ∀nat

export async function solveProblem(
  selectedTeam: Team,
  constraints: Constraints,
  candidateMatch: { home: Team; away: Team },
): Promise<boolean> {
  const solver = await initSolver();
  if (!solver) throw new Error("Solver not initialized");

  const T = 8; // number of matchdays

  // Variable name: x_i_j_t (0-based i, j, t)
  const x = (i: number, j: number, t: number) => `x_${i}_${j}_${t}`;

  // Sum of x_i_j_t over all matchdays t
  const sumT = (i: number, j: number) =>
    Array.from({ length: T }, (_, t) => x(i, j, t)).join(" + ");

  let problem = "Maximize\n obj: 0\nSubject To\n";
  let c = 0;

  // ── 1. A team cannot play against itself ──────────────────────────────────
  for (let i = 0; i < NB_TEAMS; i++) {
    problem += ` c${c++}: ${sumT(i, i)} = 0\n`;
  }

  // ── 2. Each ordered pair (i,j) plays at most once across all matchdays ────
  for (let i = 0; i < NB_TEAMS; i++) {
    for (let j = 0; j < NB_TEAMS; j++) {
      if (i === j) continue;
      problem += ` c${c++}: ${sumT(i, j)} + ${sumT(j, i)} <= 1\n`;
    }
  }

  // ── 3. Each team plays exactly 1 home and 1 away per pot ──────────────────
  for (let i = 0; i < NB_TEAMS; i++) {
    for (
      let potStart = 0;
      potStart <= NB_TEAMS - NB_TEAMS_PER_POT;
      potStart += NB_TEAMS_PER_POT
    ) {
      // Exactly 1 home match against this pot
      const homeTerms: string[] = [];
      for (let k = 0; k < NB_TEAMS_PER_POT; k++) {
        const j = potStart + k;
        for (let t = 0; t < T; t++) homeTerms.push(x(i, j, t));
      }
      problem += ` c${c++}: ${homeTerms.join(" + ")} = 1\n`;

      // Exactly 1 away match against this pot
      const awayTerms: string[] = [];
      for (let k = 0; k < NB_TEAMS_PER_POT; k++) {
        const j = potStart + k;
        for (let t = 0; t < T; t++) awayTerms.push(x(j, i, t));
      }
      problem += ` c${c++}: ${awayTerms.join(" + ")} = 1\n`;
    }
  }

  // ── 4. Candidate match for the selected team ──────────────────────────────
  //   selectedTeam (H) vs candidateMatch.home (A)  →  selectedTeam hosts home
  //   candidateMatch.away (H) vs selectedTeam (A)  →  away hosts selectedTeam
  problem += ` c${c++}: ${sumT(selectedTeam.id, candidateMatch.home.id)} = 1\n`;
  problem += ` c${c++}: ${sumT(candidateMatch.away.id, selectedTeam.id)} = 1\n`;

  // ── 5. Already-drawn home matches ─────────────────────────────────────────
  for (let teamId = 0; teamId < NB_TEAMS; teamId++) {
    for (const oppId of constraints.playedHome[teamId] ?? []) {
      problem += ` c${c++}: ${sumT(teamId, oppId)} = 1\n`;
    }
  }

  // ── 6. Already-drawn away matches ─────────────────────────────────────────
  for (let teamId = 0; teamId < NB_TEAMS; teamId++) {
    for (const oppId of constraints.playedAway[teamId] ?? []) {
      problem += ` c${c++}: ${sumT(oppId, teamId)} = 1\n`;
    }
  }

  // ── 7. Same-nationality teams cannot play each other ──────────────────────
  for (let i = 0; i < NB_TEAMS; i++) {
    for (let j = 0; j < NB_TEAMS; j++) {
      if (i === j) continue;
      if (TEAMS[i].country === TEAMS[j].country) {
        problem += ` c${c++}: ${sumT(i, j)} = 0\n`;
      }
    }
  }

  // ── 8. At most 2 matches against teams of the same nationality ────────────
  for (const nat of ALL_NATIONALITIES) {
    for (let i = 0; i < NB_TEAMS; i++) {
      const natTerms: string[] = [];
      for (let j = 0; j < NB_TEAMS; j++) {
        if (i === j) continue;
        if (TEAMS[j].country === nat) {
          for (let t = 0; t < T; t++) {
            natTerms.push(x(i, j, t), x(j, i, t));
          }
        }
      }
      if (natTerms.length > 0) {
        problem += ` c${c++}: ${natTerms.join(" + ")} <= 2\n`;
      }
    }
  }

  // ── Binary variable declarations ──────────────────────────────────────────
  let binaries = "Binary\n";
  for (let i = 0; i < NB_TEAMS; i++) {
    for (let j = 0; j < NB_TEAMS; j++) {
      for (let t = 0; t < T; t++) {
        binaries += ` ${x(i, j, t)}\n`;
      }
    }
  }

  problem += binaries + "End";

  try {
    const solution = solver.solve(problem);
    return solution.Status === "Optimal";
  } catch (e) {
    console.error("Solver error:", e);
    return false;
  }
}