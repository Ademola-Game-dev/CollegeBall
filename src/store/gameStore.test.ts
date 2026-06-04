import { describe, expect, it } from "vitest";
import { createInitialSeason, defaultCoach, defaultHomeTeam, generateProspects } from "../game/data/defaults";
import { useGameStore } from "./gameStore";

describe("season transactions", () => {
  it("generates a playable schedule for new seasons", () => {
    const season = createInitialSeason(defaultHomeTeam, defaultCoach);
    expect(season.schedule.length).toBeGreaterThanOrEqual(12);
    expect(season.currentGameIndex).toBe(0);
    expect(season.top25.length).toBeGreaterThan(0);
  });

  it("spends scouting points instead of weekly recruiting points when scouting", () => {
    const season = {
      ...createInitialSeason(defaultHomeTeam, defaultCoach),
      recruitingPoints: 88,
    };
    const [prospect] = generateProspects(60, 60, defaultHomeTeam.region, 1);

    useGameStore.setState({
      season,
      prospects: [prospect],
      scoutingPoints: 2,
    });

    useGameStore.getState().scoutProspect(prospect.id);
    const next = useGameStore.getState();
    const updatedProspect = next.prospects.find((p) => p.id === prospect.id);

    expect(next.scoutingPoints).toBe(1);
    expect(next.season?.recruitingPoints).toBe(88);
    expect(updatedProspect?.scouted).toBe(true);
  });
});
