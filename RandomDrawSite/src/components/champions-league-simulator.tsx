"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  Play,
  Pause,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

// Phase machine for each (team, pot) draw step:
//
//   idle
//     ↓ [Start] — pick first team, potIndex = team.pot (only draw from own pot onwards)
//   team-selected
//     ↓ [Find Admissible] — compute preadmissible with CURRENT constraints
//   showing-admissible
//     ↓ [Draw Match] — run solver, pick match, UPDATE constraints
//   showing-result
//     ↓ [Next Pot / Next Team / Finish]
//   done
//
// Key optimization: a team from pot i only needs to find opponents from pots i..3.
// Pots 0..i-1 were already decided when the earlier pot teams were drawn.
//
// Constraints are ONLY updated in showing-admissible → showing-result.

type Phase =
  | "idle"
  | "team-selected"
  | "showing-admissible"
  | "showing-result"
  | "done";

// Tracks which cells were just filled so we can flash them green
interface FlashSet {
  // key: `${teamId}-${potIndex}-h` or `${teamId}-${potIndex}-a`
  [key: string]: boolean;
}

interface SimulatorState {
  phase: Phase;
  drawOrder: Team[];
  drawIndex: number;
  currentPotIndex: number;
  admissible: { home: Team; away: Team }[];
  constraints: Constraints;
  isLoading: boolean;
  solverProgress: { tested: number; total: number } | null;
  flash: FlashSet; // cells currently highlighted green
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

const AUTO_SPEED_MS = 800;

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
    flash: {},
  };
}

// For team from pot i, the first pot to draw is pot i (lower pots already settled)
function startingPotIndex(team: Team): number {
  return team.pot;
}

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

// Build flash keys for a just-drawn match:
// - selected team's home cell (pot currentPotIndex)
// - selected team's away cell (pot currentPotIndex)
// - homeOpponent's away cell (pot team.pot) — they played away at team's ground
// - awayOpponent's home cell (pot team.pot) — they hosted team
function buildFlashKeys(
  team: Team,
  potIndex: number,
  homeOpp: Team,
  awayOpp: Team,
): FlashSet {
  return {
    [`${team.id}-${potIndex}-h`]: true,
    [`${team.id}-${potIndex}-a`]: true,
    [`${homeOpp.id}-${team.pot}-a`]: true,
    [`${awayOpp.id}-${team.pot}-h`]: true,
  };
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
      className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-300 ${active ? "border-[#cfa749] bg-[#cfa749]/10 shadow-md" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"}`}
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
  potIndex,
}: {
  couples: { home: Team; away: Team }[];
  potIndex: number;
}) {
  if (couples.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {couples.length} admissible pair{couples.length > 1 ? "s" : ""} in{"  "}
        <PotBadge potIndex={potIndex} small />
      </p>
      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
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

function ResultTable({
  constraints,
  activePot,
  flash,
  highlightTeamId,
}: {
  constraints: Constraints;
  activePot: number;
  flash: FlashSet;
  highlightTeamId: number | null;
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
                  className="px-2 py-1 text-center text-[10px] text-slate-400"
                  title="Opponent who visits this team"
                >
                  <Home className="h-3 w-3 inline" />
                </th>
                <th
                  key={`${p}-a`}
                  className="px-2 py-1 text-center text-[10px] text-slate-400"
                  title="Opponent who hosts this team"
                >
                  <Plane className="h-3 w-3 inline" />
                </th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {potTeams.map((team) => {
            const isHighlighted = team.id === highlightTeamId;
            return (
              <tr
                key={team.id}
                className={`border-b border-slate-100 dark:border-slate-800 transition-colors duration-300 ${
                  isHighlighted
                    ? "bg-[#cfa749]/10 dark:bg-[#cfa749]/10"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <td
                  className={`px-3 py-1.5 font-semibold truncate max-w-[7rem] ${isHighlighted ? "text-[#b45309] dark:text-[#cfa749]" : "text-slate-700 dark:text-slate-200"}`}
                >
                  {team.name}
                </td>
                {[0, 1, 2, 3].map((pi) => {
                  const h = getHomeOpponent(team.id, pi, constraints);
                  const a = getAwayOpponent(team.id, pi, constraints);
                  const hFlash = flash[`${team.id}-${pi}-h`];
                  const aFlash = flash[`${team.id}-${pi}-a`];
                  return (
                    <>
                      <td
                        key={`${pi}-h`}
                        className={`px-2 py-1.5 text-center transition-colors duration-300 ${hFlash ? "bg-green-200 dark:bg-green-800/60" : ""}`}
                      >
                        {h ? (
                          <span className="inline-block max-w-[5rem] truncate text-slate-700 dark:text-slate-300">
                            {h.name}
                          </span>
                        ) : (
                          <span className="inline-block w-12 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                        )}
                      </td>
                      <td
                        key={`${pi}-a`}
                        className={`px-2 py-1.5 text-center transition-colors duration-300 ${aFlash ? "bg-green-200 dark:bg-green-800/60" : ""}`}
                      >
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DebugPanel({ logs, frozen }: { logs: LogEntry[]; frozen: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

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

  // Auto mode
  const [autoMode, setAutoMode] = useState(false);
  const autoRef = useRef(false); // mutable ref tracks live auto state for async loops

  // Flash timeout cleanup
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const log = useCallback((msg: string, level: LogLevel = "info") => {
    const ts = new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev.slice(-400), { level, msg, ts }]);
  }, []);

  const reset = useCallback(() => {
    autoRef.current = false;
    setAutoMode(false);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
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
        if (state.currentPotIndex < 3)
          return `Next — Pot ${state.currentPotIndex + 2}`;
        return state.drawIndex + 1 < state.drawOrder.length
          ? "Next Team"
          : "Finish Draw";
      case "done":
        return "New Draw";
    }
  };

  // Schedule flash clear after 900ms
  const scheduleFlashClear = useCallback(() => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      setState((s) => ({ ...s, flash: {} }));
    }, 900);
  }, []);

  // ── Solver loop ──────────────────────────────────────────────────────────────
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

  // ── Core step function — advances the state machine by one phase ─────────────
  // Returns the new state after the step (used by auto mode to chain steps)
  const step = useCallback(
    async (s: SimulatorState): Promise<SimulatorState | null> => {
      if (s.isLoading) return null;

      // DONE
      if (s.phase === "done") return null;

      // IDLE → TEAM-SELECTED: select first team, start at that team's pot
      if (s.phase === "idle") {
        const team = s.drawOrder[0];
        const potIndex = startingPotIndex(team);
        log(
          `▶ Draw started — Team 1/36: ${team.name} (Pot ${team.pot + 1}), starting at Pot ${potIndex + 1}`,
          "info",
        );
        const next: SimulatorState = {
          ...s,
          phase: "team-selected",
          drawIndex: 0,
          currentPotIndex: potIndex,
          flash: {},
        };
        setState(next);
        setActiveTablePot(team.pot);
        return next;
      }

      // TEAM-SELECTED → SHOWING-ADMISSIBLE: compute pre-admissible with current constraints
      if (s.phase === "team-selected") {
        const team = s.drawOrder[s.drawIndex];
        log(
          `── ${team.name} (Pot ${team.pot + 1}) → Pot ${s.currentPotIndex + 1} opponents ──`,
          "info",
        );
        log(
          `  playedHome[${team.id}]: [${(s.constraints.playedHome[team.id] ?? []).join(", ")}]`,
          "info",
        );
        log(
          `  playedAway[${team.id}]: [${(s.constraints.playedAway[team.id] ?? []).join(", ")}]`,
          "info",
        );
        log(
          `  nationalities[${team.id}]: ${JSON.stringify(s.constraints.nationalities[team.id])}`,
          "info",
        );

        const admissible = preadmissibleOpponentCouples(
          team,
          s.currentPotIndex,
          s.constraints,
        );
        log(
          `  ${admissible.length} pre-admissible pair(s) found`,
          admissible.length === 0 ? "warn" : "info",
        );

        const next: SimulatorState = {
          ...s,
          phase: "showing-admissible",
          admissible,
        };
        setState(next);
        return next;
      }

      // SHOWING-ADMISSIBLE → SHOWING-RESULT: run solver, update constraints
      if (s.phase === "showing-admissible") {
        const team = s.drawOrder[s.drawIndex];

        if (s.admissible.length === 0) {
          log(
            `✗ FATAL: empty admissible list for ${team.name} Pot ${s.currentPotIndex + 1}`,
            "warn",
          );
          setLogs((cur) => {
            setFrozenLogs(cur);
            return cur;
          });
          const next: SimulatorState = { ...s, phase: "done" };
          setState(next);
          return null;
        }

        setState((prev) => ({
          ...prev,
          isLoading: true,
          solverProgress: { tested: 0, total: s.admissible.length },
        }));

        const result = await runSolver(
          team,
          s.currentPotIndex,
          s.constraints,
          s.admissible,
        );

        if (!result) {
          log(
            `✗ FATAL: no feasible match for ${team.name} Pot ${s.currentPotIndex + 1}`,
            "warn",
          );
          log(`  ↑ Scroll up to inspect tested pairs.`, "warn");
          setLogs((cur) => {
            setFrozenLogs(cur);
            return cur;
          });
          const next: SimulatorState = {
            ...s,
            isLoading: false,
            solverProgress: null,
            phase: "done",
          };
          setState(next);
          return null;
        }

        // Match confirmed — update constraints for both directions:
        //   team (H) vs result.home (A)
        //   result.away (H) vs team (A)
        log(
          `✓ ${team.name} (H) vs ${result.home.name} (A)  |  ${result.away.name} (H) vs ${team.name} (A)`,
          "success",
        );

        const updatedConstraints = updateConstraints(
          updateConstraints(s.constraints, team, result.home),
          result.away,
          team,
        );

        const flashKeys = buildFlashKeys(
          team,
          s.currentPotIndex,
          result.home,
          result.away,
        );
        scheduleFlashClear();

        const next: SimulatorState = {
          ...s,
          phase: "showing-result",
          constraints: updatedConstraints,
          isLoading: false,
          solverProgress: null,
          flash: flashKeys,
        };
        setState(next);
        return next;
      }

      // SHOWING-RESULT → TEAM-SELECTED or DONE: advance cursor
      if (s.phase === "showing-result") {
        // Next pot for same team (still within pots 0..3)
        if (s.currentPotIndex < 3) {
          const next: SimulatorState = {
            ...s,
            phase: "team-selected",
            currentPotIndex: s.currentPotIndex + 1,
            flash: {},
          };
          setState(next);
          return next;
        }

        // All pots done for this team — move to next team
        const nextIndex = s.drawIndex + 1;

        if (nextIndex >= s.drawOrder.length) {
          log("🏆 Draw complete!", "success");
          const next: SimulatorState = { ...s, phase: "done", flash: {} };
          setState(next);
          return null;
        }

        const nextTeam = s.drawOrder[nextIndex];
        const potIndex = startingPotIndex(nextTeam);
        log(
          `▶ Team ${nextIndex + 1}/36: ${nextTeam.name} (Pot ${nextTeam.pot + 1}), starting at Pot ${potIndex + 1}`,
          "info",
        );

        const next: SimulatorState = {
          ...s,
          phase: "team-selected",
          drawIndex: nextIndex,
          currentPotIndex: potIndex,
          admissible: [],
          flash: {},
        };
        setState(next);
        setActiveTablePot(nextTeam.pot);
        return next;
      }

      return null;
    },
    [log, runSolver, scheduleFlashClear],
  );

  // ── Manual next button ───────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (state.isLoading) return;
    if (state.phase === "done") {
      reset();
      return;
    }
    await step(state);
  }, [state, step, reset]);

  // ── Auto mode loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoMode) {
      autoRef.current = false;
      return;
    }
    autoRef.current = true;

    const delay = (ms: number) =>
      new Promise<void>((res) => setTimeout(res, ms));
    const speedMs = AUTO_SPEED_MS;

    const run = async () => {
      // Get latest state via a ref-like approach: re-read from setState callback
      let current: SimulatorState | null = null;
      setState((s) => {
        current = s;
        return s;
      });
      // Wait one tick for current to be populated
      await delay(0);
      if (!current) return;

      while (autoRef.current) {
        const s = current as SimulatorState;
        if (s.phase === "done" || s.isLoading) break;

        const next = await step(s);
        if (!next || next.phase === "done") {
          autoRef.current = false;
          setAutoMode(false);
          break;
        }
        current = next;

        // Pause between showing-result steps so flash animation is visible
        if (
          next.phase === "showing-result" ||
          next.phase === "showing-admissible"
        ) {
          await delay(speedMs);
        }
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode]);

  const toggleAuto = () => {
    if (autoMode) {
      autoRef.current = false;
      setAutoMode(false);
    } else {
      if (state.phase === "done") return;
      setAutoMode(true);
    }
  };

  const progress =
    state.drawIndex < 0
      ? 0
      : ((state.drawIndex * 4 + state.currentPotIndex) / (36 * 4)) * 100;

  const matchCount = countMatches(state.constraints);

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
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
          {/* Current team card + pot indicators */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
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
                    const isSkipped = pi < startingPotIndex(currentTeam); // already decided, not drawn now
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
                            : isSkipped
                              ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
                              : isCurrent
                                ? "bg-[#cfa749]/15 border-[#cfa749]/40 text-[#b45309] animate-pulse"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        Pot {pi + 1}
                        <div className="mt-0.5">
                          {isDone
                            ? "✓"
                            : isSkipped
                              ? "–"
                              : isCurrent
                                ? "↓"
                                : "·"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CTA + Auto controls */}
          <div className="flex gap-2">
            <button
              onClick={handleNext}
              disabled={state.isLoading || autoMode}
              className={`flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-bold text-sm shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                state.phase === "done"
                  ? "bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900"
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

            {/* Auto mode button */}
            {state.phase !== "done" && (
              <div className="flex gap-1">
                <button
                  onClick={toggleAuto}
                  disabled={state.isLoading && !autoMode}
                  title={autoMode ? "Pause auto" : "Start auto draw"}
                  className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3.5 font-bold text-sm shadow-md transition-all duration-200 active:scale-[0.98] ${
                    autoMode
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {autoMode ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {state.phase !== "idle" && state.phase !== "done" && (
            <button
              onClick={reset}
              className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
            >
              Reset draw
            </button>
          )}

          {/* Admissible list + solver progress */}
          {(state.phase === "showing-admissible" ||
            state.phase === "showing-result") &&
            currentTeam && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="p-4">
                  <AdmissibleList
                    couples={state.admissible}
                    potIndex={state.currentPotIndex}
                  />
                  {state.isLoading && state.solverProgress && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>LP solver</span>
                        <span>
                          {state.solverProgress.tested} /{" "}
                          {state.solverProgress.total} pairs
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

          {/* Result card */}
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
                  <div className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-4 w-4 text-green-700 dark:text-green-300 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        H: <span className="font-semibold">{homeOpp.name}</span>
                        <span className="mx-2 text-slate-400">|</span>
                        A: <span className="font-semibold">{awayOpp.name}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap items-center">
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
            <span className="ml-auto text-xs text-slate-400">
              {matchCount} matches drawn
            </span>
          </div>

          <ResultTable
            constraints={state.constraints}
            activePot={activeTablePot}
            flash={state.flash}
            highlightTeamId={currentTeam?.id ?? null}
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

          {/* <DebugPanel logs={frozenLogs ?? logs} frozen={frozenLogs !== null} /> */}
        </div>
      </div>
    </div>
  );
}
