"use client";

import { useState, useCallback, useRef } from "react";
import { POTS, TEAMS } from "../lib/data";
import type { Team, Constraints } from "../lib/types";
import {
  initializeConstraints,
  updateConstraints,
  preadmissibleOpponentCouples,
} from "../lib/logic";
import { solveProblem } from "../lib/solver";
import {
  Trophy,
  Dices,
  Home,
  Plane,
  ChevronRight,
  Loader2,
  RotateCcw,
  Terminal,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

// The draw proceeds through these phases for each (team, pot) pair:
//
//   idle
//     ↓ [Start Draw] — pick first team, set drawIndex=0, potIndex=0
//   team-selected
//     ↓ [Find Admissible] — compute preadmissible with CURRENT constraints, store in state
//   showing-admissible
//     ↓ [Draw Match] — run solver on admissible list, pick a match, UPDATE constraints
//   showing-result
//     ↓ [Next Pot]  — if potIndex < 3: potIndex++, go back to team-selected
//        [Next Team] — if potIndex == 3: drawIndex++, potIndex=0, go back to team-selected
//        [Finish]   — if no more teams: done
//   done
//
// Constraints are ONLY updated in the showing-admissible → showing-result transition,
// immediately after a match is confirmed by the solver. Pre-admissible computation
// always reads from the constraints state at the moment the button is pressed.

type Phase =
  | "idle"
  | "team-selected" // team is chosen, waiting to compute admissible
  | "showing-admissible" // admissible list computed and displayed, waiting to draw
  | "showing-result" // match drawn, constraints updated, result displayed
  | "done";

interface SimulatorState {
  phase: Phase;
  drawOrder: Team[];
  drawIndex: number; // index into drawOrder for the current team
  currentPotIndex: number; // 0–3, which opponent pot we're drawing from
  admissible: { home: Team; away: Team }[]; // valid pairs for current (team, pot)
  constraints: Constraints; // single source of truth for all drawn matches
  isLoading: boolean;
  solverProgress: { tested: number; total: number } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POT_COLORS = [
  {
    bg: "bg-[#0e1e5b]",
    light: "bg-[#0e1e5b]/10",
    text: "text-[#0e1e5b]",
    border: "border-[#0e1e5b]/30",
    label: "Pot 1",
  },
  {
    bg: "bg-[#7c3aed]",
    light: "bg-[#7c3aed]/10",
    text: "text-[#7c3aed]",
    border: "border-[#7c3aed]/30",
    label: "Pot 2",
  },
  {
    bg: "bg-[#0369a1]",
    light: "bg-[#0369a1]/10",
    text: "text-[#0369a1]",
    border: "border-[#0369a1]/30",
    label: "Pot 3",
  },
  {
    bg: "bg-[#b45309]",
    light: "bg-[#b45309]/10",
    text: "text-[#b45309]",
    border: "border-[#b45309]/30",
    label: "Pot 4",
  },
];

type LogLevel = "info" | "success" | "warn" | "solver";
interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDrawOrder(): Team[] {
  return [
    ...shuffle(POTS[0]),
    ...shuffle(POTS[1]),
    ...shuffle(POTS[2]),
    ...shuffle(POTS[3]),
  ];
}

function initialState(): SimulatorState {
  return {
    phase: "idle",
    drawOrder: buildDrawOrder(),
    drawIndex: -1,
    currentPotIndex: 0,
    admissible: [],
    constraints: initializeConstraints(),
    isLoading: false,
    solverProgress: null,
  };
}

// Reads who visits `teamId` from pot `potIndex` (team is HOME)
function getHomeOpponent(
  teamId: number,
  potIndex: number,
  c: Constraints,
): Team | null {
  const id = (c.playedHome[teamId] ?? []).find(
    (id) => TEAMS[id]?.pot === potIndex,
  );
  return id !== undefined ? (TEAMS[id] ?? null) : null;
}

// Reads who hosts `teamId` from pot `potIndex` (team is AWAY)
function getAwayOpponent(
  teamId: number,
  potIndex: number,
  c: Constraints,
): Team | null {
  const id = (c.playedAway[teamId] ?? []).find(
    (id) => TEAMS[id]?.pot === potIndex,
  );
  return id !== undefined ? (TEAMS[id] ?? null) : null;
}

function countMatches(c: Constraints): number {
  return Object.values(c.playedHome).reduce((acc, arr) => acc + arr.length, 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PotBadge({ potIndex, small }: { potIndex: number; small?: boolean }) {
  const c = POT_COLORS[potIndex];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-white font-semibold ${c.bg} ${small ? "text-[10px]" : "text-xs"}`}
    >
      {c.label}
    </span>
  );
}

function TeamCard({ team, active }: { team: Team; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-300
      ${active ? "border-[#cfa749] bg-[#cfa749]/10 shadow-md" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
    >
      <PotBadge potIndex={team.pot} />
      <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
        {team.name}
      </span>
      <span className="ml-auto text-xs text-slate-400 shrink-0">
        {team.country}
      </span>
    </div>
  );
}

function AdmissibleList({
  couples,
}: {
  couples: { home: Team; away: Team }[];
}) {
  if (couples.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {couples.length} admissible pair{couples.length > 1 ? "s" : ""}
      </p>
      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
        {couples.map(({ home, away }, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <Home className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate font-medium">{home.name}</span>
            <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>
            <Plane className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate font-medium">{away.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reads all results directly from constraints — no separate results state
function ResultTable({
  constraints,
  activePot,
}: {
  constraints: Constraints;
  activePot: number;
}) {
  const potTeams = POTS[activePot as keyof typeof POTS];
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800">
            <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 w-32">
              Team
            </th>
            {[0, 1, 2, 3].map((p) => (
              <th
                key={p}
                colSpan={2}
                className="px-2 py-2 text-center font-semibold text-slate-600 dark:text-slate-300"
              >
                <PotBadge potIndex={p} small />
              </th>
            ))}
          </tr>
          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <th className="px-3 py-1 text-left text-[9px] text-slate-400 font-normal italic">
              H = hosts · A = visits
            </th>
            {[0, 1, 2, 3].map((p) => (
              <>
                <th
                  key={`${p}-h`}
                  className="px-2 py-1 text-center text-[10px] text-slate-400 font-medium"
                  title="Opponent who visits this team"
                >
                  <Home className="h-3 w-3 inline" />
                </th>
                <th
                  key={`${p}-a`}
                  className="px-2 py-1 text-center text-[10px] text-slate-400 font-medium"
                  title="Opponent who hosts this team"
                >
                  <Plane className="h-3 w-3 inline" />
                </th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {potTeams.map((team) => (
            <tr
              key={team.id}
              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[7rem]">
                {team.name}
              </td>
              {[0, 1, 2, 3].map((pi) => {
                const h = getHomeOpponent(team.id, pi, constraints);
                const a = getAwayOpponent(team.id, pi, constraints);
                return (
                  <>
                    <td key={`${pi}-h`} className="px-2 py-1.5 text-center">
                      {h ? (
                        <span className="inline-block max-w-[5rem] truncate text-slate-700 dark:text-slate-300">
                          {h.name}
                        </span>
                      ) : (
                        <span className="inline-block w-12 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                      )}
                    </td>
                    <td key={`${pi}-a`} className="px-2 py-1.5 text-center">
                      {a ? (
                        <span className="inline-block max-w-[5rem] truncate text-slate-700 dark:text-slate-300">
                          {a.name}
                        </span>
                      ) : (
                        <span className="inline-block w-12 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                      )}
                    </td>
                  </>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DebugPanel({ logs, frozen }: { logs: LogEntry[]; frozen: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colors: Record<LogLevel, string> = {
    info: "text-slate-400",
    success: "text-green-400",
    warn: "text-yellow-400",
    solver: "text-sky-400",
  };
  return (
    <div
      className={`rounded-xl border overflow-hidden bg-slate-950 ${frozen ? "border-yellow-500/50" : "border-slate-200 dark:border-slate-700"}`}
    >
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
        <Terminal className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-widest">
          Debug log
        </span>
        {frozen && (
          <span className="ml-1 text-[10px] font-mono font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded px-1.5 py-0.5">
            ⚠ FROZEN — fatal error
          </span>
        )}
        <span className="ml-auto text-[10px] text-slate-600 font-mono">
          {logs.length} entries
        </span>
      </div>
      <div
        ref={containerRef}
        className="h-52 overflow-y-auto p-3 space-y-0.5 font-mono text-[11px]"
      >
        {logs.length === 0 ? (
          <span className="text-slate-600">Waiting for draw to start…</span>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="flex gap-2 leading-5">
              <span className="text-slate-600 shrink-0 select-none">
                {l.ts}
              </span>
              <span className={colors[l.level]}>{l.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChampionsLeagueSimulator() {
  const [state, setState] = useState<SimulatorState>(initialState);
  const [activeTablePot, setActiveTablePot] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [frozenLogs, setFrozenLogs] = useState<LogEntry[] | null>(null);

  const log = useCallback((msg: string, level: LogLevel = "info") => {
    const ts = new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev.slice(-300), { level, msg, ts }]);
  }, []);

  const reset = useCallback(() => {
    setState(initialState());
    setActiveTablePot(0);
    setFrozenLogs(null);
    setLogs([
      {
        level: "warn",
        msg: "Draw reset.",
        ts: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      },
    ]);
  }, []);

  const currentTeam =
    state.drawIndex >= 0 ? state.drawOrder[state.drawIndex] : null;

  // ── Button label reflects the action that WILL happen on click ──────────────
  const buttonLabel = (): string => {
    if (state.isLoading) return "Computing…";
    switch (state.phase) {
      case "idle":
        return "Start Draw";
      case "team-selected":
        return `Find Admissible — Pot ${state.currentPotIndex + 1}`;
      case "showing-admissible":
        return `Draw Pot ${state.currentPotIndex + 1} Match`;
      case "showing-result":
        return state.currentPotIndex < 3
          ? `Next — Pot ${state.currentPotIndex + 2}`
          : state.drawIndex + 1 < state.drawOrder.length
            ? `Next Team`
            : "Finish Draw";
      case "done":
        return "New Draw";
    }
  };

  // ── Solver loop: shuffles admissible, tests pairs, returns first feasible ───
  const runSolver = useCallback(
    async (
      team: Team,
      potIndex: number,
      constraints: Constraints,
      admissible: { home: Team; away: Team }[],
    ): Promise<{ home: Team; away: Team } | null> => {
      const shuffled = shuffle(admissible);
      const total = shuffled.length;
      const names = (ids: number[]) =>
        ids.map((id) => TEAMS[id]?.name ?? id).join(", ");

      log(
        `  Solver testing ${total} pair(s) for ${team.name} vs Pot ${potIndex + 1}`,
        "solver",
      );

      for (let i = 0; i < shuffled.length; i++) {
        const { home, away } = shuffled[i];
        setState((s) => ({ ...s, solverProgress: { tested: i, total } }));
        log(`  [${i + 1}/${total}] H=${home.name} · A=${away.name}`, "solver");

        const t0 = performance.now();
        const feasible = await solveProblem(team, constraints, { home, away });
        const dt = (performance.now() - t0).toFixed(0);

        if (feasible) {
          log(`  ✓ Feasible (${dt}ms)`, "success");
          setState((s) => ({ ...s, solverProgress: { tested: i + 1, total } }));
          return { home, away };
        }

        // Log constraint context for each infeasible pair to aid diagnosis
        log(`  ✗ Infeasible (${dt}ms)`, "info");
        log(
          `    ${team.name}:   home=[${names(constraints.playedHome[team.id] ?? [])}] away=[${names(constraints.playedAway[team.id] ?? [])}]`,
          "info",
        );
        log(
          `    H:${home.name}: home=[${names(constraints.playedHome[home.id] ?? [])}] away=[${names(constraints.playedAway[home.id] ?? [])}]`,
          "info",
        );
        log(
          `    A:${away.name}: home=[${names(constraints.playedHome[away.id] ?? [])}] away=[${names(constraints.playedAway[away.id] ?? [])}]`,
          "info",
        );
      }

      log(
        `  No feasible pair found for ${team.name} in Pot ${potIndex + 1}`,
        "warn",
      );
      return null;
    },
    [log],
  );

  // ── Main click handler — one action per phase ─────────────────────────────
  const handleNext = useCallback(async () => {
    if (state.isLoading) return;

    // ── DONE: reset ──────────────────────────────────────────────────────────
    if (state.phase === "done") {
      reset();
      return;
    }

    // ── IDLE → TEAM-SELECTED ─────────────────────────────────────────────────
    // Pick the first team from the draw order, set potIndex to 0.
    // Constraints are fresh (no matches drawn yet).
    if (state.phase === "idle") {
      const team = state.drawOrder[0];
      log(
        `▶ Draw started — Team 1/36: ${team.name} (Pot ${team.pot + 1})`,
        "info",
      );
      setState((s) => ({
        ...s,
        phase: "team-selected",
        drawIndex: 0,
        currentPotIndex: 0,
      }));
      setActiveTablePot(team.pot);
      return;
    }

    // ── TEAM-SELECTED → SHOWING-ADMISSIBLE ───────────────────────────────────
    // Compute pre-admissible pairs using state.constraints AS-IS.
    // This is the only place preadmissibleOpponentCouples is called,
    // and it always reads from the current (up-to-date) constraints.
    if (state.phase === "team-selected") {
      const team = state.drawOrder[state.drawIndex];
      log(
        `── ${team.name} (Pot ${team.pot + 1}) → looking for Pot ${state.currentPotIndex + 1} opponents ──`,
        "info",
      );
      log(
        `  playedHome[${team.id}]: [${(state.constraints.playedHome[team.id] ?? []).join(", ")}]`,
        "info",
      );
      log(
        `  playedAway[${team.id}]: [${(state.constraints.playedAway[team.id] ?? []).join(", ")}]`,
        "info",
      );
      log(
        `  nationalities[${team.id}]: ${JSON.stringify(state.constraints.nationalities[team.id])}`,
        "info",
      );

      // Pre-admissible filter: cheap constraint check, no solver call
      const admissible = preadmissibleOpponentCouples(
        team,
        state.currentPotIndex,
        state.constraints,
      );
      log(
        `  ${admissible.length} pre-admissible pair(s) found`,
        admissible.length === 0 ? "warn" : "info",
      );

      setState((s) => ({ ...s, phase: "showing-admissible", admissible }));
      return;
    }

    // ── SHOWING-ADMISSIBLE → SHOWING-RESULT ──────────────────────────────────
    // Run the LP solver on the admissible list to find a feasible match.
    // On success: update constraints with the two new matches.
    // Constraints are updated HERE and ONLY HERE.
    if (state.phase === "showing-admissible") {
      const team = state.drawOrder[state.drawIndex];

      if (state.admissible.length === 0) {
        log(
          `✗ FATAL: admissible list is empty for ${team.name} Pot ${state.currentPotIndex + 1} — cannot draw`,
          "warn",
        );
        setLogs((current) => {
          setFrozenLogs(current);
          return current;
        });
        setState((s) => ({ ...s, phase: "done" }));
        return;
      }

      setState((s) => ({
        ...s,
        isLoading: true,
        solverProgress: { tested: 0, total: state.admissible.length },
      }));

      // Solver reads state.constraints — which have NOT been touched since last update
      const result = await runSolver(
        team,
        state.currentPotIndex,
        state.constraints,
        state.admissible,
      );

      if (!result) {
        log(
          `✗ FATAL: solver found no feasible match for ${team.name} Pot ${state.currentPotIndex + 1}`,
          "warn",
        );
        log(`  ↑ Scroll up to inspect which pairs were tested.`, "warn");
        setLogs((current) => {
          setFrozenLogs(current);
          return current;
        });
        setState((s) => ({
          ...s,
          isLoading: false,
          solverProgress: null,
          phase: "done",
        }));
        return;
      }

      // Match confirmed: update constraints with both directions
      //   team (H) vs result.home (A) → team hosts result.home
      //   result.away (H) vs team (A) → result.away hosts team
      log(
        `✓ Match drawn: ${team.name} (H) vs ${result.home.name} (A)  |  ${result.away.name} (H) vs ${team.name} (A)`,
        "success",
      );

      const updatedConstraints = updateConstraints(
        updateConstraints(state.constraints, team, result.home),
        result.away,
        team,
      );

      setState((s) => ({
        ...s,
        phase: "showing-result",
        constraints: updatedConstraints, // ← constraints updated exactly here
        isLoading: false,
        solverProgress: null,
      }));
      return;
    }

    // ── SHOWING-RESULT → TEAM-SELECTED (next pot or next team) ───────────────
    // Constraints are already updated. Just advance the cursor.
    if (state.phase === "showing-result") {
      if (state.currentPotIndex < 3) {
        // Same team, next pot
        setState((s) => ({
          ...s,
          phase: "team-selected",
          currentPotIndex: state.currentPotIndex + 1,
        }));
        return;
      }

      // All 4 pots drawn for this team — move to next team
      const nextIndex = state.drawIndex + 1;

      if (nextIndex >= state.drawOrder.length) {
        log("🏆 Draw complete!", "success");
        setState((s) => ({ ...s, phase: "done" }));
        return;
      }

      const nextTeam = state.drawOrder[nextIndex];
      log(
        `▶ Team ${nextIndex + 1}/36: ${nextTeam.name} (Pot ${nextTeam.pot + 1})`,
        "info",
      );
      setState((s) => ({
        ...s,
        phase: "team-selected",
        drawIndex: nextIndex,
        currentPotIndex: 0,
        admissible: [], // cleared — will be recomputed when team-selected fires
      }));
      setActiveTablePot(nextTeam.pot);
    }
  }, [state, reset, log, runSolver]);

  const progress =
    state.drawIndex < 0
      ? 0
      : ((state.drawIndex * 4 + state.currentPotIndex) / (36 * 4)) * 100;

  const matchCount = countMatches(state.constraints);

  return (
    <div className="flex flex-col gap-6">
      {/* Overall progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Draw progress</span>
          <span>
            {state.phase === "done"
              ? "Complete"
              : `Team ${Math.max(state.drawIndex + 1, 0)}/36`}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#cfa749] rounded-full transition-all duration-500"
            style={{ width: `${state.phase === "done" ? 100 : progress}%` }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-6 items-start">
        {/* ── Left panel ── */}
        <div className="space-y-4">
          {/* Current team card + pot progress indicators */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Dices className="h-4 w-4 text-[#cfa749]" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Current Team
              </span>
            </div>
            <div className="p-4">
              {currentTeam ? (
                <TeamCard team={currentTeam} active />
              ) : (
                <p className="text-sm text-slate-400 text-center py-2">
                  {state.phase === "done"
                    ? "All teams drawn!"
                    : "Press Start to begin"}
                </p>
              )}

              {currentTeam && (
                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((pi) => {
                    const isDone =
                      getHomeOpponent(currentTeam.id, pi, state.constraints) !==
                        null &&
                      getAwayOpponent(currentTeam.id, pi, state.constraints) !==
                        null;
                    const isCurrent =
                      pi === state.currentPotIndex &&
                      (state.phase === "team-selected" ||
                        state.phase === "showing-admissible" ||
                        state.phase === "showing-result");
                    return (
                      <div
                        key={pi}
                        className={`rounded-lg p-2 text-center text-[10px] font-semibold border transition-all duration-300 ${
                          isDone
                            ? `${POT_COLORS[pi].light} ${POT_COLORS[pi].border} ${POT_COLORS[pi].text}`
                            : isCurrent
                              ? "bg-[#cfa749]/15 border-[#cfa749]/40 text-[#b45309] animate-pulse"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        Pot {pi + 1}
                        <div className="mt-0.5">
                          {isDone ? "✓" : isCurrent ? "↓" : "·"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Admissible list — shown once computed */}
          {(state.phase === "showing-admissible" ||
            state.phase === "showing-result") &&
            currentTeam && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Admissible —{" "}
                    <PotBadge potIndex={state.currentPotIndex} small />
                  </span>
                </div>
                <div className="p-4">
                  <AdmissibleList couples={state.admissible} />
                  {state.isLoading && state.solverProgress && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>LP solver</span>
                        <span>
                          {state.solverProgress.tested} /{" "}
                          {state.solverProgress.total} pairs tested
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-150 ease-out"
                          style={{
                            width: `${state.solverProgress.total > 0 ? (state.solverProgress.tested / state.solverProgress.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Drawn match result card */}
          {state.phase === "showing-result" &&
            currentTeam &&
            (() => {
              const homeOpp = getHomeOpponent(
                currentTeam.id,
                state.currentPotIndex,
                state.constraints,
              );
              const awayOpp = getAwayOpponent(
                currentTeam.id,
                state.currentPotIndex,
                state.constraints,
              );
              return homeOpp && awayOpp ? (
                <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-green-100 dark:border-green-800">
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5" /> Drawn —{" "}
                      <PotBadge potIndex={state.currentPotIndex} small />
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-500 text-xs w-10 shrink-0">
                        Home
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {homeOpp.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Plane className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-500 text-xs w-10 shrink-0">
                        Away
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {awayOpp.name}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

          {/* CTA Button */}
          <button
            onClick={handleNext}
            disabled={state.isLoading}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold text-sm shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
              state.phase === "done"
                ? "bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900"
                : "bg-[#0e1e5b] hover:bg-[#1e3a8a] text-white"
            }`}
          >
            {state.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Computing…
              </>
            ) : state.phase === "done" ? (
              <>
                <RotateCcw className="h-4 w-4" /> New Draw
              </>
            ) : (
              <>
                {buttonLabel()} <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>

          {state.phase !== "idle" && state.phase !== "done" && (
            <button
              onClick={reset}
              className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
            >
              Reset draw
            </button>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setActiveTablePot(p)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 border ${
                  activeTablePot === p
                    ? `${POT_COLORS[p].bg} text-white border-transparent shadow-sm`
                    : `bg-white dark:bg-slate-900 ${POT_COLORS[p].text} ${POT_COLORS[p].border}`
                }`}
              >
                Pot {p + 1}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400 self-center">
              {matchCount} matches drawn
            </span>
          </div>

          <ResultTable
            constraints={state.constraints}
            activePot={activeTablePot}
          />

          {state.phase === "done" &&
            (frozenLogs ? (
              <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3 flex items-center gap-2">
                <span className="text-yellow-400 shrink-0 text-base">⚠</span>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                  Fatal: no feasible match found. Read the frozen log, then
                  press Reset.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#cfa749]/30 bg-[#cfa749]/10 px-4 py-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#cfa749] shrink-0" />
                <p className="text-sm text-[#b45309] dark:text-[#cfa749] font-medium">
                  Draw complete — {matchCount} matches scheduled.
                </p>
              </div>
            ))}

          <DebugPanel logs={frozenLogs ?? logs} frozen={frozenLogs !== null} />
        </div>
      </div>
    </div>
  );
}
