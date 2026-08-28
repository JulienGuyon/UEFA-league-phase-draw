import type { Competition, Constraints, Team } from "./types";
import { NB_TEAMS, NB_TEAMS_PER_POT } from "./data";
// The WASM binary MUST come from the same highs-js release as the JS glue we
// import below. Loading it from lovasoa.github.io (which tracks the latest
// release) against our pinned glue made every solve throw "memory access out of
// bounds", which the draw then read as "no feasible match". Bundling the .wasm
// that ships with the installed package keeps the two versions in lockstep.
import highsWasmUrl from "highs/runtime?url";

let highs: any = null;
let highsPromise: Promise<any> | null = null;

/** Raised when HiGHS itself fails, as opposed to reporting an infeasible model. */
export class SolverError extends Error {
  readonly reason?: unknown;

  constructor(message: string, reason?: unknown) {
    super(message);
    this.name = "SolverError";
    this.reason = reason;
  }
}

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

      highs = await highsLoader({ locateFile: () => highsWasmUrl });

      return highs;
    } catch (e) {
      console.error("Failed to load HiGHS solver:", e);
      highsPromise = null;
      throw new SolverError("Could not load the HiGHS solver.", e);
    }
  })();

  return highsPromise;
}

// ─── Problem formulation ──────────────────────────────────────────────────────
//
// Mirrors the Julia solve_problem() formulation.
//
// Variables: x_i_j ∈ {0,1}
//   = 1 if team i hosts team j at some point in the league phase.
//
// 36 teams, 4 pots of 9 teams each.
//
// The Julia model indexes its variables by matchday as well (x[i,j,t], t in
// 1..8), but no constraint there ever separates the matchdays: every constraint
// is written on ∑_t x_i_j_t, and constraint 2 caps ∑_t (x_i_j_t + x_j_i_t) at 1.
// Substituting x_i_j := ∑_t x_i_j_t therefore gives an equivalent model on 1 296
// binaries instead of 10 368 — same feasibility verdict, a fraction of the work,
// which matters when the solver runs in the browser on every candidate pair.
// (Scheduling the resulting matchups over eight matchdays is a separate
// question — see the noncompact draw outcomes discussed in the paper.)
//
// Constraints (in order, matching Julia):
//   1. A team cannot play against itself:
//        x_i_i = 0  ∀i
//
//   2. Each unordered pair {i,j} meets at most once:
//        x_i_j + x_j_i ≤ 1  ∀i≠j
//
//   3. Each team plays exactly 1 home and 1 away match against each pot:
//        ∑_{j in pot} x_i_j = 1  ∀i, ∀pot
//        ∑_{j in pot} x_j_i = 1  ∀i, ∀pot
//
//   4. Candidate match for selected team (the pair being tested):
//        x_selectedTeam_home = 1
//        x_away_selectedTeam = 1
//
//   5. Already-drawn home matches:
//        x_teamId_oppId = 1  for each (teamId, oppId) in playedHome
//
//   6. Already-drawn away matches:
//        x_oppId_teamId = 1  for each (teamId, oppId) in playedAway
//
//   7. Same-nationality teams cannot play each other:
//        x_i_j = 0  ∀i≠j where country(i) == country(j)
//
//   8. At most 2 matches (home + away) against teams of any one nationality:
//        ∑_{j: country(j)==nat} (x_i_j + x_j_i) ≤ 2  ∀i, ∀nat

export async function solveProblem(
  competition: Competition,
  selectedTeam: Team,
  constraints: Constraints,
  candidateMatch: { home: Team; away: Team },
): Promise<boolean> {
  const solver = await initSolver();
  if (!solver) throw new SolverError("Solver not initialized");

  const teams = competition.teams;

  // Variable name: x_i_j (0-based i, j) — 1 iff i hosts j.
  const x = (i: number, j: number) => `x_${i}_${j}`;

  let problem = "Maximize\n obj: 0\nSubject To\n";
  let c = 0;

  // ── 1. A team cannot play against itself ──────────────────────────────────
  for (let i = 0; i < NB_TEAMS; i++) {
    problem += ` c${c++}: ${x(i, i)} = 0\n`;
  }

  // ── 2. Each pair of teams meets at most once ──────────────────────────────
  for (let i = 0; i < NB_TEAMS; i++) {
    for (let j = i + 1; j < NB_TEAMS; j++) {
      problem += ` c${c++}: ${x(i, j)} + ${x(j, i)} <= 1\n`;
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
      // Exactly 1 away match against this pot
      const awayTerms: string[] = [];
      for (let k = 0; k < NB_TEAMS_PER_POT; k++) {
        const j = potStart + k;
        homeTerms.push(x(i, j));
        awayTerms.push(x(j, i));
      }
      problem += ` c${c++}: ${homeTerms.join(" + ")} = 1\n`;
      problem += ` c${c++}: ${awayTerms.join(" + ")} = 1\n`;
    }
  }

  // ── 4. Candidate match for the selected team ──────────────────────────────
  //   selectedTeam (H) vs candidateMatch.home (A)  →  selectedTeam hosts home
  //   candidateMatch.away (H) vs selectedTeam (A)  →  away hosts selectedTeam
  problem += ` c${c++}: ${x(selectedTeam.id, candidateMatch.home.id)} = 1\n`;
  problem += ` c${c++}: ${x(candidateMatch.away.id, selectedTeam.id)} = 1\n`;

  // ── 5. Already-drawn home matches ─────────────────────────────────────────
  for (let teamId = 0; teamId < NB_TEAMS; teamId++) {
    for (const oppId of constraints.playedHome[teamId] ?? []) {
      problem += ` c${c++}: ${x(teamId, oppId)} = 1\n`;
    }
  }

  // ── 6. Already-drawn away matches ─────────────────────────────────────────
  for (let teamId = 0; teamId < NB_TEAMS; teamId++) {
    for (const oppId of constraints.playedAway[teamId] ?? []) {
      problem += ` c${c++}: ${x(oppId, teamId)} = 1\n`;
    }
  }

  // ── 7. Same-nationality teams cannot play each other ──────────────────────
  for (let i = 0; i < NB_TEAMS; i++) {
    for (let j = 0; j < NB_TEAMS; j++) {
      if (i === j) continue;
      if (teams[i].country === teams[j].country) {
        problem += ` c${c++}: ${x(i, j)} = 0\n`;
      }
    }
  }

  // ── 8. At most 2 matches against teams of the same nationality ────────────
  for (const nat of competition.nationalities) {
    for (let i = 0; i < NB_TEAMS; i++) {
      const natTerms: string[] = [];
      for (let j = 0; j < NB_TEAMS; j++) {
        if (i === j) continue;
        if (teams[j].country === nat) natTerms.push(x(i, j), x(j, i));
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
      binaries += ` ${x(i, j)}\n`;
    }
  }

  problem += binaries + "End";

  let solution: { Status?: string };
  try {
    solution = solver.solve(problem);
  } catch (e) {
    // A HiGHS failure is not the same thing as an infeasible model — reporting
    // it as "infeasible" is what turned a broken WASM build into a bogus
    // "no feasible match found" on the very first pick. Surface it instead.
    throw new SolverError("HiGHS failed to solve the draw model.", e);
  }

  if (solution.Status === "Optimal") return true;
  if (solution.Status === "Infeasible") return false;

  throw new SolverError(`Unexpected solver status: ${solution.Status}`);
}
