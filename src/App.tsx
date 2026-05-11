/**
 * App – root component that switches between screens based on game state.
 */

import "pepjs";
import { useGameStore } from "./store/gameStore";
import MainMenu from "./screens/MainMenu";
import GameScreen from "./screens/GameScreen";
import SeasonHub from "./screens/SeasonHub";
import RecruitingScreen from "./screens/RecruitingScreen";
import NewGameSetup from "./screens/NewGameSetup";
import JobOffersScreen from "./screens/JobOffersScreen";
import TournamentScreen from "./screens/TournamentScreen";

export default function App() {
  const screen = useGameStore((s) => s.screen);

  switch (screen) {
    case "menu":
      return <MainMenu />;
    case "new-game":
      return <NewGameSetup />;
    case "game":
      return <GameScreen />;
    case "season":
      return <SeasonHub />;
    case "recruiting":
      return <RecruitingScreen />;
    case "jobOffers":
      return <JobOffersScreen />;
    case "tournaments":
      return <TournamentScreen />;
    default:
      return <MainMenu />;
  }
}