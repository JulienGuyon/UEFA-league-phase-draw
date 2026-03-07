"use client";

import { useState, useRef, useEffect } from "react";
import { TEAMS } from "../lib/data";
import type { Team } from "../lib/types";
import {
  useDrawSimulator,
  getHomeOpponent,
  getAwayOpponent,
  startingPotIndex,
  POT_COLORS,
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
  ChevronDown,
  Users,
} from "lucide-react";

function MobilePotBadge({ potIndex }: { potIndex: number }) {
  const c = POT_COLORS[potIndex];
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-white font-semibold text-[9px] ${c.bg}`}
    >
      {c.label}
    </span>
  );
}

function TeamMatchupCard({
  team,
  constraints,
  currentPotIndex,
  isDrawing,
  flash,
}: {
  team: Team;
  constraints: import("../lib/types").Constraints;
  currentPotIndex: number;
  isDrawing: boolean;
  flash: Record<string, boolean>;
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      <div className="divide-y divide-[hsl(var(--border))]/50">
        {[0, 1, 2, 3].map((pi) => {
          const homeOpp = getHomeOpponent(team.id, pi, constraints);
          const awayOpp = getAwayOpponent(team.id, pi, constraints);
          const isActive = isDrawing && pi === currentPotIndex;
          const isSkipped = isDrawing && pi < startingPotIndex(team);
          const isDone = homeOpp !== null && awayOpp !== null;
          const hFlash = flash[`${team.id}-${pi}-h`];
          const aFlash = flash[`${team.id}-${pi}-a`];

          return (
            <div
              key={pi}
              className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 ${
                isActive && !isDone
                  ? "bg-[var(--uefa-gold)]/6"
                  : ""
              }`}
            >
              <MobilePotBadge potIndex={pi} />

              <div className="flex-1 grid grid-cols-2 gap-2">
                {/* Home opponent */}
                <div
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors duration-300 ${
                    hFlash
                      ? "bg-sky-100 dark:bg-sky-900/40"
                      : homeOpp
                        ? "bg-[hsl(var(--muted))]/40"
                        : ""
                  }`}
                >
                  <Home className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
                  {homeOpp ? (
                    <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                      {homeOpp.name}
                    </span>
                  ) : isActive && !isDone ? (
                    <span className="h-3 w-16 rounded bg-[var(--uefa-gold)]/15 animate-subtle-pulse" />
                  ) : isSkipped ? (
                    <span className="h-3 w-12 rounded bg-[hsl(var(--muted))]/30" />
                  ) : (
                    <span className="h-3 w-12 rounded bg-[hsl(var(--muted))]/50" />
                  )}
                </div>

                {/* Away opponent */}
                <div
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors duration-300 ${
                    aFlash
                      ? "bg-sky-100 dark:bg-sky-900/40"
                      : awayOpp
                        ? "bg-[hsl(var(--muted))]/40"
                        : ""
                  }`}
                >
                  <Plane className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
                  {awayOpp ? (
                    <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                      {awayOpp.name}
                    </span>
                  ) : isActive && !isDone ? (
                    <span className="h-3 w-16 rounded bg-[var(--uefa-gold)]/15 animate-subtle-pulse" />
                  ) : isSkipped ? (
                    <span className="h-3 w-12 rounded bg-[hsl(var(--muted))]/30" />
                  ) : (
                    <span className="h-3 w-12 rounded bg-[hsl(var(--muted))]/50" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamBrowseChip({
  team,
  isSelected,
  isDrawn,
  onSelect,
}: {
  team: Team;
  isSelected: boolean;
  isDrawn: boolean;
  onSelect: () => void;
}) {
  const c = POT_COLORS[team.pot];
  return (
    <button
      onClick={onSelect}
      className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-medium transition-all duration-200 border ${
        isSelected
          ? `${c.bg} text-white border-transparent shadow-sm`
          : isDrawn
            ? `bg-[hsl(var(--card))] ${c.text} border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50`
            : "bg-[hsl(var(--muted))]/30 text-[hsl(var(--muted-foreground))]/50 border-transparent"
      }`}
    >
      {team.name}
    </button>
  );
}

export function MobileDrawSimulator() {
  const sim = useDrawSimulator();
  const {
    state,
    currentTeam,
    fatalError,
    autoMode,
    handleNext,
    toggleAuto,
    reset,
    progress,
    matchCount,
    buttonLabel,
  } = sim;

  const [browseTeamId, setBrowseTeamId] = useState<number | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayTeam =
    browseTeamId !== null
      ? TEAMS[browseTeamId]
      : currentTeam;

  const isBrowsing = browseTeamId !== null;

  useEffect(() => {
    if (currentTeam && browseTeamId === null && scrollRef.current) {
      const idx = state.drawOrder.findIndex((t) => t.id === currentTeam.id);
      if (idx >= 0) {
        const chips = scrollRef.current.children;
        if (chips[idx]) {
          (chips[idx] as HTMLElement).scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }
  }, [currentTeam, browseTeamId, state.drawOrder]);

  const drawnTeamIds = new Set<number>();
  for (let i = 0; i <= state.drawIndex && i < state.drawOrder.length; i++) {
    drawnTeamIds.add(state.drawOrder[i].id);
  }

  const handleBrowse = (teamId: number) => {
    if (browseTeamId === teamId) {
      setBrowseTeamId(null);
    } else {
      setBrowseTeamId(teamId);
    }
  };

  useEffect(() => {
    if (state.phase !== "done") {
      setBrowseTeamId(null);
    }
  }, [state.drawIndex, state.phase]);

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))] font-medium">
          <span>{matchCount} matches</span>
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

      {/* Current team header */}
      {displayTeam ? (
        <div
          className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
            isBrowsing
              ? "bg-[hsl(var(--muted))]/50 ring-1 ring-[hsl(var(--border))]"
              : "bg-[var(--uefa-gold)]/8 ring-1 ring-[var(--uefa-gold)]/30"
          }`}
        >
          <MobilePotBadge potIndex={displayTeam.pot} />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-[hsl(var(--foreground))] truncate block">
              {displayTeam.name}
            </span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
              {displayTeam.country}
              {isBrowsing && (
                <span className="ml-2 text-[var(--uefa-gold-dark)]">
                  (browsing)
                </span>
              )}
            </span>
          </div>
          {isBrowsing && (
            <button
              onClick={() => setBrowseTeamId(null)}
              className="text-[10px] text-[hsl(var(--muted-foreground))] underline underline-offset-2"
            >
              Back to live
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-[hsl(var(--muted))]/30 px-4 py-4 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {state.phase === "done"
              ? "All teams drawn!"
              : "Press Start to begin the draw"}
          </p>
        </div>
      )}

      {/* Team matchup card */}
      {displayTeam && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Matchups
            </span>
            <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
              <Home className="h-2.5 w-2.5 inline mr-0.5" /> home
              <span className="mx-1.5">&middot;</span>
              <Plane className="h-2.5 w-2.5 inline mr-0.5" /> away
            </span>
          </div>
          <TeamMatchupCard
            team={displayTeam}
            constraints={state.constraints}
            currentPotIndex={state.currentPotIndex}
            isDrawing={!isBrowsing && state.phase !== "done" && state.phase !== "idle"}
            flash={isBrowsing ? {} : state.flash}
          />
        </div>
      )}

      {/* Solver progress */}
      {state.isLoading && state.solverProgress && !isBrowsing && (
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-mono text-[hsl(var(--muted-foreground))]">
            <span>LP solver</span>
            <span>
              {state.solverProgress.tested} / {state.solverProgress.total} pairs
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

      {/* Result flash */}
      {state.phase === "showing-result" && currentTeam && !isBrowsing &&
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
            <div className="rounded-lg border border-[var(--uefa-blue)]/20 bg-[var(--uefa-blue)]/5 px-3 py-2.5 flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-[var(--uefa-blue)] shrink-0" />
              <span className="text-xs text-[hsl(var(--foreground))]">
                <Home className="h-3 w-3 inline mr-0.5" />
                <span className="font-semibold">{homeOpp.name}</span>
                <span className="mx-1.5 text-[hsl(var(--muted-foreground))]">&middot;</span>
                <Plane className="h-3 w-3 inline mr-0.5" />
                <span className="font-semibold">{awayOpp.name}</span>
              </span>
            </div>
          ) : null;
        })()}

      {/* Done status */}
      {state.phase === "done" &&
        (fatalError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 px-3 py-2.5 flex items-center gap-2">
            <span className="text-amber-500 shrink-0 text-xs">⚠</span>
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              No feasible match found. Tap New Draw to restart.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--uefa-gold)]/20 bg-[var(--uefa-gold)]/5 px-3 py-2.5 flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-[var(--uefa-gold)] shrink-0" />
            <p className="text-xs text-[var(--uefa-gold-dark)] font-medium">
              Draw complete — {matchCount} matches scheduled.
            </p>
          </div>
        ))}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleNext}
          disabled={state.isLoading || autoMode}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
            state.phase === "done"
              ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
              : "bg-[var(--uefa-blue)] text-white"
          }`}
        >
          {state.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Computing...</span>
            </>
          ) : state.phase === "done" ? (
            <>
              <RotateCcw className="h-4 w-4" /> New Draw
            </>
          ) : (
            <>
              <span className="truncate">{buttonLabel()}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </>
          )}
        </button>

        {state.phase !== "done" && (
          <button
            onClick={toggleAuto}
            disabled={state.isLoading && !autoMode}
            className={`flex items-center justify-center rounded-xl w-12 transition-all duration-200 active:scale-[0.97] ${
              autoMode
                ? "bg-[var(--uefa-gold)] text-white"
                : "bg-[var(--uefa-blue)] text-white"
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
          className="text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors py-0.5"
        >
          Reset draw
        </button>
      )}

      {/* Admissible couples */}
      {(state.phase === "showing-admissible" || state.phase === "showing-result") &&
        !isBrowsing &&
        state.admissible.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Admissible pairs
              </span>
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
              <span className="text-[9px] text-[hsl(var(--muted-foreground))] tabular-nums">
                {state.admissible.length} pair{state.admissible.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
              <div className="max-h-40 overflow-y-auto divide-y divide-[hsl(var(--border))]/50">
                {state.admissible.map(({ home, away }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 rounded-md px-2 py-1 bg-[hsl(var(--muted))]/30">
                        <Home className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
                        <span className="text-[11px] font-medium text-[hsl(var(--foreground))] truncate">
                          {home.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md px-2 py-1 bg-[hsl(var(--muted))]/30">
                        <Plane className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
                        <span className="text-[11px] font-medium text-[hsl(var(--foreground))] truncate">
                          {away.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Team browser */}
      {(state.phase !== "idle") && (
        <div>
          <button
            onClick={() => setShowBrowser(!showBrowser)}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 w-full"
          >
            <Users className="h-3 w-3" />
            <span>Browse teams</span>
            <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${showBrowser ? "rotate-180" : ""}`}
            />
          </button>

          {showBrowser && (
            <div
              ref={scrollRef}
              className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin"
            >
              {state.drawOrder.map((team) => (
                <TeamBrowseChip
                  key={team.id}
                  team={team}
                  isSelected={displayTeam?.id === team.id}
                  isDrawn={drawnTeamIds.has(team.id)}
                  onSelect={() => handleBrowse(team.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
