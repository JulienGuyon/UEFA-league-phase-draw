"use client";

import { POTS, TEAMS } from "../lib/data";
import type { Team, Constraints } from "../lib/types";
import {
  useDrawSimulator,
  getHomeOpponent,
  getAwayOpponent,
  startingPotIndex,
  POT_COLORS,
  type FlashSet,
} from "../hooks/use-draw-simulator";
import {
  Trophy,
  Home,
  Plane,
  ChevronRight,
  Loader2,
  RotateCcw,
  Play,
  Pause,
} from "lucide-react";

function PotBadge({ potIndex, small }: { potIndex: number; small?: boolean }) {
  const c = POT_COLORS[potIndex];
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-white font-medium ${c.bg} ${small ? "text-[9px]" : "text-[10px]"}`}
    >
      {c.label}
    </span>
  );
}

function TeamCard({ team, active }: { team: Team; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
        active
          ? "bg-[var(--uefa-gold)]/8 ring-1 ring-[var(--uefa-gold)]/30"
          : "bg-[hsl(var(--muted))]/50"
      }`}
    >
      <PotBadge potIndex={team.pot} />
      <span className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
        {team.name}
      </span>
      <span className="ml-auto text-[11px] text-[hsl(var(--muted-foreground))] shrink-0">
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
      <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
        {couples.length} admissible pair{couples.length > 1 ? "s" : ""} in{" "}
        <PotBadge potIndex={potIndex} small />
      </p>
      <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
        {couples.map(({ home, away }, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-[11px] rounded-md px-2.5 py-1.5 bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]"
          >
            <Home className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
            <span className="truncate font-medium text-[hsl(var(--foreground))]">
              {home.name}
            </span>
            <span className="text-[hsl(var(--border))] mx-0.5">&middot;</span>
            <Plane className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
            <span className="truncate font-medium text-[hsl(var(--foreground))]">
              {away.name}
            </span>
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
    <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="bg-[hsl(var(--muted))]/50">
            <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--muted-foreground))] w-28">
              Team
            </th>
            {[0, 1, 2, 3].map((p) => (
              <th key={p} colSpan={2} className="px-1.5 py-2.5 text-center">
                <PotBadge potIndex={p} small />
              </th>
            ))}
          </tr>
          <tr className="border-b border-[hsl(var(--border))]">
            <th className="px-3 py-1 text-left text-[9px] text-[hsl(var(--muted-foreground))] font-normal">
              H = hosts &middot; A = visits
            </th>
            {[0, 1, 2, 3].map((p) => (
              <>
                <th
                  key={`${p}-h`}
                  className="px-1.5 py-1 text-center text-[hsl(var(--muted-foreground))]"
                  title="Opponent who visits this team"
                >
                  <Home className="h-3 w-3 inline" />
                </th>
                <th
                  key={`${p}-a`}
                  className="px-1.5 py-1 text-center text-[hsl(var(--muted-foreground))]"
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
                className={`border-b border-[hsl(var(--border))]/50 transition-colors duration-200 ${
                  isHighlighted
                    ? "bg-[var(--uefa-gold)]/6"
                    : "hover:bg-[hsl(var(--muted))]/30"
                }`}
              >
                <td
                  className={`px-3 py-1.5 font-semibold truncate max-w-[6.5rem] ${
                    isHighlighted
                      ? "text-[var(--uefa-gold-dark)]"
                      : "text-[hsl(var(--foreground))]"
                  }`}
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
                        className={`px-1.5 py-1.5 text-center transition-colors duration-300 ${hFlash ? "bg-emerald-100/80 dark:bg-emerald-900/30" : ""}`}
                      >
                        {h ? (
                          <span className="inline-block max-w-[4.5rem] truncate text-[hsl(var(--foreground))]">
                            {h.name}
                          </span>
                        ) : (
                          <span className="inline-block w-10 h-3.5 rounded bg-[hsl(var(--muted))]/60" />
                        )}
                      </td>
                      <td
                        key={`${pi}-a`}
                        className={`px-1.5 py-1.5 text-center transition-colors duration-300 ${aFlash ? "bg-emerald-100/80 dark:bg-emerald-900/30" : ""}`}
                      >
                        {a ? (
                          <span className="inline-block max-w-[4.5rem] truncate text-[hsl(var(--foreground))]">
                            {a.name}
                          </span>
                        ) : (
                          <span className="inline-block w-10 h-3.5 rounded bg-[hsl(var(--muted))]/60" />
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

export function ChampionsLeagueSimulator() {
  const sim = useDrawSimulator();
  const {
    state,
    currentTeam,
    activeTablePot,
    setActiveTablePot,
    fatalError,
    autoMode,
    handleNext,
    toggleAuto,
    reset,
    progress,
    matchCount,
    buttonLabel,
  } = sim;

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-[hsl(var(--muted-foreground))] font-medium">
          <span>Draw progress</span>
          <span>
            {state.phase === "done"
              ? "Complete"
              : `Team ${Math.max(state.drawIndex + 1, 0)} / 36`}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-[hsl(var(--muted))] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--uefa-gold)] transition-all duration-500 ease-out"
            style={{ width: `${state.phase === "done" ? 100 : progress}%` }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-5 items-start">
        {/* Left panel */}
        <div className="space-y-3">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
            <div className="p-4">
              {currentTeam ? (
                <TeamCard team={currentTeam} active />
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-2">
                  {state.phase === "done"
                    ? "All teams drawn!"
                    : "Press Start to begin"}
                </p>
              )}

              {currentTeam && (
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((pi) => {
                    const isDone =
                      getHomeOpponent(currentTeam.id, pi, state.constraints) !==
                        null &&
                      getAwayOpponent(currentTeam.id, pi, state.constraints) !==
                        null;
                    const isSkipped = pi < startingPotIndex(currentTeam);
                    const isCurrent =
                      pi === state.currentPotIndex &&
                      (state.phase === "team-selected" ||
                        state.phase === "showing-admissible" ||
                        state.phase === "showing-result");
                    return (
                      <div
                        key={pi}
                        className={`rounded-md p-1.5 text-center text-[9px] font-semibold transition-all duration-200 ${
                          isDone
                            ? `${POT_COLORS[pi].light} ${POT_COLORS[pi].text} ring-1 ${POT_COLORS[pi].ring}`
                            : isSkipped
                              ? "bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))]/40"
                              : isCurrent
                                ? "bg-[var(--uefa-gold)]/10 text-[var(--uefa-gold-dark)] ring-1 ring-[var(--uefa-gold)]/30 animate-subtle-pulse"
                                : "bg-[hsl(var(--muted))]/30 text-[hsl(var(--muted-foreground))]/60"
                        }`}
                      >
                        Pot {pi + 1}
                        <div className="mt-0.5 text-[8px]">
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

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={handleNext}
              disabled={state.isLoading || autoMode}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                state.phase === "done"
                  ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                  : "bg-[var(--uefa-blue)] hover:bg-[var(--uefa-blue-light)] text-white"
              }`}
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Computing...
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

            {state.phase !== "done" && (
              <button
                onClick={toggleAuto}
                disabled={state.isLoading && !autoMode}
                title={autoMode ? "Pause auto" : "Start auto draw"}
                className={`flex items-center justify-center rounded-lg px-3.5 py-3 font-semibold text-sm transition-all duration-200 active:scale-[0.98] ${
                  autoMode
                    ? "bg-[var(--uefa-gold)] hover:bg-[var(--uefa-gold-dark)] text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {autoMode ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {state.phase !== "idle" && state.phase !== "done" && (
            <button
              onClick={reset}
              className="w-full text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors py-1"
            >
              Reset draw
            </button>
          )}

          {/* Admissible list + solver progress */}
          {(state.phase === "showing-admissible" ||
            state.phase === "showing-result") &&
            currentTeam && (
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
                <div className="p-4">
                  <AdmissibleList
                    couples={state.admissible}
                    potIndex={state.currentPotIndex}
                  />
                  {state.isLoading && state.solverProgress && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                        <span>LP solver</span>
                        <span>
                          {state.solverProgress.tested} /{" "}
                          {state.solverProgress.total} pairs
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-150 ease-out"
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
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-sm text-[hsl(var(--foreground))]">
                      H:{" "}
                      <span className="font-semibold">{homeOpp.name}</span>
                      <span className="mx-2 text-[hsl(var(--muted-foreground))]">
                        |
                      </span>
                      A:{" "}
                      <span className="font-semibold">{awayOpp.name}</span>
                    </span>
                  </div>
                </div>
              ) : null;
            })()}
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          <div className="flex gap-1.5 flex-wrap items-center">
            {[0, 1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setActiveTablePot(p)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  activeTablePot === p
                    ? `${POT_COLORS[p].bg} text-white shadow-sm`
                    : `bg-[hsl(var(--card))] ${POT_COLORS[p].text} border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50`
                }`}
              >
                Pot {p + 1}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-[hsl(var(--muted-foreground))] tabular-nums">
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
            (fatalError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 px-4 py-3 flex items-center gap-2">
                <span className="text-amber-500 shrink-0 text-sm">⚠</span>
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  Fatal: no feasible match found. Press Reset to start a new
                  draw.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--uefa-gold)]/20 bg-[var(--uefa-gold)]/5 px-4 py-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[var(--uefa-gold)] shrink-0" />
                <p className="text-sm text-[var(--uefa-gold-dark)] font-medium">
                  Draw complete — {matchCount} matches scheduled.
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
