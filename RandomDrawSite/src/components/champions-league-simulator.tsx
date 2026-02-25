"use client";

import { useState, useCallback, useRef } from "react";
import { POTS, TEAMS } from "../lib/data";
import type { Team, Match, Constraints } from "../lib/types";
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

type Phase = "idle" | "team-selected" | "showing-pot" | "done";

interface PotOpponents {
  home: Team | null;
  away: Team | null;
  flash: boolean;
}

interface TeamDrawResult {
  team: Team;
  pots: [PotOpponents, PotOpponents, PotOpponents, PotOpponents];
}

interface SimulatorState {
  phase: Phase;
  drawOrder: Team[];
  drawIndex: number;
  currentPotIndex: number;
  admissible: { home: Team; away: Team }[];
  constraints: Constraints;
  results: TeamDrawResult[];
  matches: Match[];
  isLoading: boolean;
  solverProgress: { tested: number; total: number } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function emptyPotOpponents(): PotOpponents {
  return { home: null, away: null, flash: false };
}

function initResults(drawOrder: Team[]): TeamDrawResult[] {
  return drawOrder.map((team) => ({
    team,
    pots: [
      emptyPotOpponents(),
      emptyPotOpponents(),
      emptyPotOpponents(),
      emptyPotOpponents(),
    ],
  }));
}

function initialState(): SimulatorState {
  const drawOrder = buildDrawOrder();
  return {
    phase: "idle",
    drawOrder,
    drawIndex: -1,
    currentPotIndex: 0,
    admissible: [],
    constraints: initializeConstraints(),
    results: initResults(drawOrder),
    matches: [],
    isLoading: false,
    solverProgress: null,
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

function ResultTable({
  results,
  activePot,
}: {
  results: TeamDrawResult[];
  activePot: number;
}) {
  const potTeams = results.filter((r) => r.team.pot === activePot);
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
                  title="Opponent who visits this team (this team is HOME)"
                >
                  <Home className="h-3 w-3 inline" />
                </th>
                <th
                  key={`${p}-a`}
                  className="px-2 py-1 text-center text-[10px] text-slate-400 font-medium"
                  title="Opponent who hosts this team (this team is AWAY)"
                >
                  <Plane className="h-3 w-3 inline" />
                </th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {potTeams.map(({ team, pots }) => (
            <tr
              key={team.id}
              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[7rem]">
                {team.name}
              </td>
              {pots.map((po, pi) => (
                <>
                  <td
                    key={`${pi}-h`}
                    className={`px-2 py-1.5 text-center transition-colors duration-500 ${po.flash ? "bg-green-100 dark:bg-green-900/40" : ""}`}
                  >
                    {po.home ? (
                      <span className="inline-block max-w-[5rem] truncate text-slate-700 dark:text-slate-300">
                        {po.home.name}
                      </span>
                    ) : (
                      <span className="inline-block w-12 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                    )}
                  </td>
                  <td
                    key={`${pi}-a`}
                    className={`px-2 py-1.5 text-center transition-colors duration-500 ${po.flash ? "bg-green-100 dark:bg-green-900/40" : ""}`}
                  >
                    {po.away ? (
                      <span className="inline-block max-w-[5rem] truncate text-slate-700 dark:text-slate-300">
                        {po.away.name}
                      </span>
                    ) : (
                      <span className="inline-block w-12 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                    )}
                  </td>
                </>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DebugPanel({ logs, frozen }: { logs: LogEntry[]; frozen: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const colors: Record<LogLevel, string> = {
    info: "text-slate-400",
    success: "text-green-400",
    warn: "text-yellow-400",
    solver: "text-sky-400",
  };
  const containerRef = useRef<HTMLDivElement>(null);
  useState(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  });

  return (
    <div
      className={`rounded-xl border overflow-hidden ${frozen ? "border-yellow-500/50 bg-slate-950" : "border-slate-200 dark:border-slate-700 bg-slate-950"}`}
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
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChampionsLeagueSimulator() {
  const [state, setState] = useState<SimulatorState>(initialState);
  const [activeTablePot, setActiveTablePot] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  // When a fatal error occurs we freeze the log before reset wipes it,
  // so the user can read what happened. Cleared on next reset.
  const [frozenLogs, setFrozenLogs] = useState<LogEntry[] | null>(null);
  const flashTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const log = useCallback((msg: string, level: LogLevel = "info") => {
    const ts = new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev.slice(-300), { level, msg, ts }]);
  }, []);

  const clearFlashTimeouts = () => {
    flashTimeouts.current.forEach(clearTimeout);
    flashTimeouts.current = [];
  };

  const reset = useCallback(() => {
    clearFlashTimeouts();
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

  const buttonLabel = () => {
    if (state.isLoading) return "Computing…";
    if (state.phase === "idle") return "Start Draw";
    if (state.phase === "done") return "New Draw";
    if (state.phase === "team-selected")
      return `Find Pot ${state.currentPotIndex + 1} Opponents`;
    if (state.phase === "showing-pot")
      return state.currentPotIndex < 3
        ? `Draw Pot ${state.currentPotIndex + 2} Opponents`
        : "Finish Team";
    return "Next";
  };

  const currentTeam =
    state.drawIndex >= 0 ? state.drawOrder[state.drawIndex] : null;

  // Runs the solver loop with per-pair progress updates
  const findOpponentsWithProgress = useCallback(
    async (
      team: Team,
      potIndex: number,
      constraints: Constraints,
      couples: { home: Team; away: Team }[],
    ): Promise<{ home: Team; away: Team } | null> => {
      const shuffled = [...couples].sort(() => Math.random() - 0.5);
      const total = shuffled.length;

      log(
        `  Solver: ${total} candidate pair(s) to test for ${team.name} vs Pot ${potIndex + 1}`,
        "solver",
      );

      for (let i = 0; i < shuffled.length; i++) {
        const { home, away } = shuffled[i];

        // Update progress before calling solver (so UI shows "testing pair i+1")
        setState((s) => ({ ...s, solverProgress: { tested: i, total } }));
        log(
          `  [${i + 1}/${total}] Testing: H=${home.name} · A=${away.name}`,
          "solver",
        );

        const t0 = performance.now();
        const feasible = await solveProblem(team, constraints, { home, away });
        const dt = (performance.now() - t0).toFixed(0);

        if (feasible) {
          log(
            `  ✓ Feasible (${dt}ms) → H=${home.name} · A=${away.name}`,
            "success",
          );
          setState((s) => ({ ...s, solverProgress: { tested: i + 1, total } }));
          return { home, away };
        }
        // On infeasible, log full constraint context for selected team + both candidates
        const names = (ids: number[]) =>
          ids.map((id) => TEAMS[id]?.name ?? id).join(", ");
        log(`  ✗ Infeasible (${dt}ms)`, "info");
        log(
          `    ${team.name}: home=[${names(constraints.playedHome[team.id] ?? [])}] away=[${names(constraints.playedAway[team.id] ?? [])}]`,
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

  const handleNext = useCallback(async () => {
    if (state.isLoading) return;

    if (state.phase === "done") {
      reset();
      return;
    }

    if (state.phase === "idle") {
      const team = state.drawOrder[0];
      const admissible = preadmissibleOpponentCouples(
        team,
        0,
        state.constraints,
      );
      log(
        `▶ Draw started — first team: ${team.name} (Pot ${team.pot + 1})`,
        "info",
      );
      log(`  ${admissible.length} pre-admissible pair(s) for Pot 1`, "info");
      setState((s) => ({
        ...s,
        phase: "team-selected",
        drawIndex: 0,
        currentPotIndex: 0,
        admissible,
      }));
      setActiveTablePot(team.pot);
      return;
    }

    if (state.phase === "team-selected") {
      const team = state.drawOrder[state.drawIndex];
      log(
        `── ${team.name} (Pot ${team.pot + 1}) → Pot ${state.currentPotIndex + 1} opponents ──`,
        "info",
      );
      // Dump exact constraint state so we can diagnose LP infeasibility
      const ph = state.constraints.playedHome[team.id] ?? [];
      const pa = state.constraints.playedAway[team.id] ?? [];
      log(`  playedHome[${team.id}]: [${ph.join(", ")}]`, "info");
      log(`  playedAway[${team.id}]: [${pa.join(", ")}]`, "info");
      log(
        `  nationalities[${team.id}]: ${JSON.stringify(state.constraints.nationalities[team.id])}`,
        "info",
      );
      log(
        `  ${state.admissible.length} pre-admissible pair(s) to evaluate`,
        "info",
      );
      if (state.admissible.length === 0) {
        log(
          `  ✗ FATAL: pre-filter returned 0 pairs — constraint bug in preadmissibleOpponentCouples`,
          "warn",
        );
      }

      setState((s) => ({
        ...s,
        isLoading: true,
        solverProgress: { tested: 0, total: state.admissible.length },
      }));

      const result = await findOpponentsWithProgress(
        team,
        state.currentPotIndex,
        state.constraints,
        state.admissible,
      );

      if (!result) {
        log(
          `✗ FATAL: no valid pair for ${team.name} in Pot ${state.currentPotIndex + 1}`,
          "warn",
        );
        log(`  Constraints at failure:`, "warn");
        log(
          `    playedHome[${team.id}]: [${(state.constraints.playedHome[team.id] || []).join(", ")}]`,
          "warn",
        );
        log(
          `    playedAway[${team.id}]: [${(state.constraints.playedAway[team.id] || []).join(", ")}]`,
          "warn",
        );
        log(
          `    nationalities[${team.id}]: ${JSON.stringify(state.constraints.nationalities[team.id])}`,
          "warn",
        );
        log(
          `  Admissible list had ${state.admissible.length} pair(s) — all infeasible per solver`,
          "warn",
        );
        log(
          `  ↑ Scroll up to see which pairs were tested. Press Reset to start over.`,
          "warn",
        );
        // Freeze the log BEFORE resetting so it persists for the user to read
        setFrozenLogs((prev) => prev); // trigger via setLogs below
        setLogs((current) => {
          setFrozenLogs(current);
          return current;
        });
        setState((s) => ({
          ...s,
          isLoading: false,
          solverProgress: null,
          phase: "done" as Phase,
        }));
        return;
      }

      // ── Semantic summary ──────────────────────────────────────────────────
      // result.home = opponent that VISITS selectedTeam  → match: selectedTeam (H) vs result.home (A)
      // result.away = opponent that HOSTS selectedTeam   → match: result.away (H) vs selectedTeam (A)
      // ─────────────────────────────────────────────────────────────────────
      log(
        `✓ ${team.name} (H) vs ${result.home.name} (A)  |  ${result.away.name} (H) vs ${team.name} (A)`,
        "success",
      );

      // selectedTeam hosts result.home
      let newConstraints = updateConstraints(
        state.constraints,
        team,
        result.home,
      );
      // result.away hosts selectedTeam
      newConstraints = updateConstraints(newConstraints, result.away, team);

      const newMatches: Match[] = [
        ...state.matches,
        { home: team, away: result.home }, // selectedTeam is home
        { home: result.away, away: team }, // selectedTeam is away
      ];

      const newResults = state.results.map((r) => {
        // Selected team's own row:
        //   home cell = result.home (the opponent that visits selected team)
        //   away cell = result.away (the opponent that hosts selected team)
        if (r.team.id === team.id) {
          const newPots = r.pots.map((po, pi) =>
            pi === state.currentPotIndex
              ? { home: result.home, away: result.away, flash: true }
              : po,
          ) as TeamDrawResult["pots"];
          return { ...r, pots: newPots };
        }
        // result.home visited selected team → from result.home's perspective,
        // selected team is an AWAY opponent (result.home is home, selected team visited them? No —
        // result.home came TO selected team, so selected team was HOME.
        // In result.home's row: they played AWAY at selected team's ground.
        // So in result.home's pot column for selected team's pot:
        //   away cell = selected team (result.home went away to face selected team)
        if (r.team.id === result.home.id) {
          const newPots = r.pots.map((po, pi) =>
            pi === team.pot ? { ...po, away: team, flash: true } : po,
          ) as TeamDrawResult["pots"];
          return { ...r, pots: newPots };
        }
        // result.away hosted selected team → from result.away's perspective,
        // selected team is a HOME opponent (result.away was home, selected team was the visitor).
        // In result.away's row: they played HOME against selected team.
        // So in result.away's pot column for selected team's pot:
        //   home cell = selected team (selected team visited result.away)
        if (r.team.id === result.away.id) {
          const newPots = r.pots.map((po, pi) =>
            pi === team.pot ? { ...po, home: team, flash: true } : po,
          ) as TeamDrawResult["pots"];
          return { ...r, pots: newPots };
        }
        return r;
      });

      const t = setTimeout(() => {
        setState((s) => ({
          ...s,
          results: s.results.map((r) => ({
            ...r,
            pots: r.pots.map((po) => ({
              ...po,
              flash: false,
            })) as TeamDrawResult["pots"],
          })),
        }));
      }, 1200);
      flashTimeouts.current.push(t);

      // Pre-compute admissible for next pot
      const nextPotIndex = state.currentPotIndex + 1;
      const nextAdmissible =
        nextPotIndex <= 3
          ? preadmissibleOpponentCouples(team, nextPotIndex, newConstraints)
          : [];

      if (nextPotIndex <= 3) {
        log(
          `  Pre-filtered ${nextAdmissible.length} pair(s) ready for Pot ${nextPotIndex + 1}`,
          "info",
        );
      }

      setState((s) => ({
        ...s,
        phase: "showing-pot",
        constraints: newConstraints,
        matches: newMatches,
        results: newResults,
        admissible: nextAdmissible,
        isLoading: false,
        solverProgress: null,
      }));
      return;
    }

    if (state.phase === "showing-pot") {
      if (state.currentPotIndex < 3) {
        setState((s) => ({
          ...s,
          phase: "team-selected",
          currentPotIndex: state.currentPotIndex + 1,
          // admissible was already pre-computed in the previous step
        }));
      } else {
        const nextIndex = state.drawIndex + 1;
        if (nextIndex >= state.drawOrder.length) {
          log("🏆 Draw complete!", "success");
          setState((s) => ({ ...s, phase: "done" }));
          return;
        }
        const nextTeam = state.drawOrder[nextIndex];
        const admissible = preadmissibleOpponentCouples(
          nextTeam,
          0,
          state.constraints,
        );
        log(
          `\n▶ Next team: ${nextTeam.name} (Pot ${nextTeam.pot + 1}) — ${nextIndex + 1}/36`,
          "info",
        );
        log(`  ${admissible.length} pre-admissible pair(s) for Pot 1`, "info");
        setState((s) => ({
          ...s,
          phase: "team-selected",
          drawIndex: nextIndex,
          currentPotIndex: 0,
          admissible,
        }));
        setActiveTablePot(nextTeam.pot);
      }
    }
  }, [state, reset, log, findOpponentsWithProgress]);

  const progress =
    state.drawIndex < 0
      ? 0
      : ((state.drawIndex * 4 + state.currentPotIndex) / (36 * 4)) * 100;

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
          {/* Current team card */}
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
                    const res = state.results.find(
                      (r) => r.team.id === currentTeam.id,
                    );
                    const po = res?.pots[pi];
                    const isDone = po?.home != null;
                    const isCurrent =
                      pi === state.currentPotIndex &&
                      (state.phase === "team-selected" ||
                        state.phase === "showing-pot");
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

          {/* Admissible panel + solver progress */}
          {state.phase === "team-selected" && currentTeam && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Admissible —{" "}
                  <PotBadge potIndex={state.currentPotIndex} small />
                </span>
              </div>
              <div className="p-4">
                <AdmissibleList couples={state.admissible} />

                {/* Solver progress bar — visible only while loading */}
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
                          width: `${
                            state.solverProgress.total > 0
                              ? (state.solverProgress.tested /
                                  state.solverProgress.total) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected pair result */}
          {state.phase === "showing-pot" &&
            currentTeam &&
            (() => {
              const res = state.results.find(
                (r) => r.team.id === currentTeam.id,
              );
              const po = res?.pots[state.currentPotIndex];
              return po?.home ? (
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
                        {po.home.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Plane className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-500 text-xs w-10 shrink-0">
                        Away
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {po.away?.name}
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
              {state.matches.length} matches drawn
            </span>
          </div>

          <ResultTable results={state.results} activePot={activeTablePot} />

          {state.phase === "done" &&
            (frozenLogs ? (
              <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3 flex items-center gap-2">
                <span className="text-yellow-400 shrink-0 text-base">⚠</span>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                  Fatal: no valid pair found. Read the frozen log above, then
                  press Reset.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#cfa749]/30 bg-[#cfa749]/10 px-4 py-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#cfa749] shrink-0" />
                <p className="text-sm text-[#b45309] dark:text-[#cfa749] font-medium">
                  Draw complete — {state.matches.length} matches scheduled.
                </p>
              </div>
            ))}

          {/* Debug log panel */}
          <DebugPanel logs={frozenLogs ?? logs} frozen={frozenLogs !== null} />
        </div>
      </div>
    </div>
  );
}
