import { useState, useCallback, useRef, useEffect } from "react";
import { POTS, TEAMS } from "../lib/data";
import type { Team, Constraints } from "../lib/types";
import {
  initializeConstraints,
  updateConstraints,
  preadmissibleOpponentCouples,
} from "../lib/logic";
import { solveProblem } from "../lib/solver";

export type Phase =
  | "idle"
  | "team-selected"
  | "showing-admissible"
  | "showing-result"
  | "done";

export type FlashSet = Record<string, boolean>;

export interface SimulatorState {
  phase: Phase;
  drawOrder: Team[];
  drawIndex: number;
  currentPotIndex: number;
  admissible: { home: Team; away: Team }[];
  constraints: Constraints;
  isLoading: boolean;
  solverProgress: { tested: number; total: number } | null;
  flash: FlashSet;
}

const AUTO_SPEED_MS = 800;

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

export function startingPotIndex(team: Team): number {
  return team.pot;
}

export function getHomeOpponent(
  teamId: number,
  potIndex: number,
  c: Constraints,
): Team | null {
  const id = (c.playedHome[teamId] ?? []).find(
    (id) => TEAMS[id]?.pot === potIndex,
  );
  return id !== undefined ? (TEAMS[id] ?? null) : null;
}

export function getAwayOpponent(
  teamId: number,
  potIndex: number,
  c: Constraints,
): Team | null {
  const id = (c.playedAway[teamId] ?? []).find(
    (id) => TEAMS[id]?.pot === potIndex,
  );
  return id !== undefined ? (TEAMS[id] ?? null) : null;
}

export function countMatches(c: Constraints): number {
  return Object.values(c.playedHome).reduce((acc, arr) => acc + arr.length, 0);
}

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

export const POT_COLORS = [
  {
    bg: "bg-[var(--uefa-blue)]",
    light: "bg-[var(--uefa-blue)]/8",
    text: "text-[var(--uefa-blue)]",
    border: "border-[var(--uefa-blue)]/20",
    ring: "ring-[var(--uefa-blue)]/20",
    label: "Pot 1",
    hex: "#0e1e5b",
  },
  {
    bg: "bg-violet-600",
    light: "bg-violet-600/8",
    text: "text-violet-600",
    border: "border-violet-600/20",
    ring: "ring-violet-600/20",
    label: "Pot 2",
    hex: "#7c3aed",
  },
  {
    bg: "bg-sky-600",
    light: "bg-sky-600/8",
    text: "text-sky-600",
    border: "border-sky-600/20",
    ring: "ring-sky-600/20",
    label: "Pot 3",
    hex: "#0284c7",
  },
  {
    bg: "bg-amber-600",
    light: "bg-amber-600/8",
    text: "text-amber-600",
    border: "border-amber-600/20",
    ring: "ring-amber-600/20",
    label: "Pot 4",
    hex: "#d97706",
  },
];

export function useDrawSimulator() {
  const [state, setState] = useState<SimulatorState>(initialState);
  const [activeTablePot, setActiveTablePot] = useState(0);
  const [fatalError, setFatalError] = useState(false);

  const [autoMode, setAutoMode] = useState(false);
  const autoRef = useRef(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    autoRef.current = false;
    setAutoMode(false);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setState(initialState());
    setActiveTablePot(0);
    setFatalError(false);
  }, []);

  const currentTeam =
    state.drawIndex >= 0 ? state.drawOrder[state.drawIndex] : null;

  const buttonLabel = (): string => {
    if (state.isLoading) return "Computing...";
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

  const scheduleFlashClear = useCallback(() => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      setState((s) => ({ ...s, flash: {} }));
    }, 900);
  }, []);

  const runSolver = useCallback(
    async (
      team: Team,
      constraints: Constraints,
      admissible: { home: Team; away: Team }[],
    ): Promise<{ home: Team; away: Team } | null> => {
      const shuffled = shuffle(admissible);
      const total = shuffled.length;

      for (let i = 0; i < shuffled.length; i++) {
        const { home, away } = shuffled[i];
        setState((s) => ({ ...s, solverProgress: { tested: i, total } }));
        const feasible = await solveProblem(team, constraints, { home, away });
        if (feasible) {
          setState((s) => ({ ...s, solverProgress: { tested: i + 1, total } }));
          return { home, away };
        }
      }
      return null;
    },
    [],
  );

  const step = useCallback(
    async (s: SimulatorState): Promise<SimulatorState | null> => {
      if (s.isLoading) return null;
      if (s.phase === "done") return null;

      if (s.phase === "idle") {
        const team = s.drawOrder[0];
        const next: SimulatorState = {
          ...s,
          phase: "team-selected",
          drawIndex: 0,
          currentPotIndex: startingPotIndex(team),
          flash: {},
        };
        setState(next);
        setActiveTablePot(team.pot);
        return next;
      }

      if (s.phase === "team-selected") {
        const team = s.drawOrder[s.drawIndex];
        const admissible = preadmissibleOpponentCouples(
          team,
          s.currentPotIndex,
          s.constraints,
        );
        const next: SimulatorState = {
          ...s,
          phase: "showing-admissible",
          admissible,
        };
        setState(next);
        return next;
      }

      if (s.phase === "showing-admissible") {
        const team = s.drawOrder[s.drawIndex];

        if (s.admissible.length === 0) {
          setFatalError(true);
          const next: SimulatorState = { ...s, phase: "done" };
          setState(next);
          return null;
        }

        setState((prev) => ({
          ...prev,
          isLoading: true,
          solverProgress: { tested: 0, total: s.admissible.length },
        }));

        const result = await runSolver(team, s.constraints, s.admissible);

        if (!result) {
          setFatalError(true);
          const next: SimulatorState = {
            ...s,
            isLoading: false,
            solverProgress: null,
            phase: "done",
          };
          setState(next);
          return null;
        }

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

      if (s.phase === "showing-result") {
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

        const nextIndex = s.drawIndex + 1;
        if (nextIndex >= s.drawOrder.length) {
          const next: SimulatorState = { ...s, phase: "done", flash: {} };
          setState(next);
          return null;
        }

        const nextTeam = s.drawOrder[nextIndex];
        const next: SimulatorState = {
          ...s,
          phase: "team-selected",
          drawIndex: nextIndex,
          currentPotIndex: startingPotIndex(nextTeam),
          admissible: [],
          flash: {},
        };
        setState(next);
        setActiveTablePot(nextTeam.pot);
        return next;
      }

      return null;
    },
    [runSolver, scheduleFlashClear],
  );

  const handleNext = useCallback(async () => {
    if (state.isLoading) return;
    if (state.phase === "done") {
      reset();
      return;
    }
    await step(state);
  }, [state, step, reset]);

  useEffect(() => {
    if (!autoMode) {
      autoRef.current = false;
      return;
    }
    autoRef.current = true;

    const delay = (ms: number) =>
      new Promise<void>((res) => setTimeout(res, ms));

    const run = async () => {
      let current: SimulatorState | null = null;
      setState((s) => {
        current = s;
        return s;
      });
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

        if (
          next.phase === "showing-result" ||
          next.phase === "showing-admissible"
        ) {
          await delay(AUTO_SPEED_MS);
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
    } else if (state.phase !== "done") setAutoMode(true);
  };

  const progress =
    state.drawIndex < 0
      ? 0
      : ((state.drawIndex * 4 + state.currentPotIndex) / (36 * 4)) * 100;

  const matchCount = countMatches(state.constraints);

  return {
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
  };
}
