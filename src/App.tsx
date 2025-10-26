import { useState, type FormEvent } from "react";
import "./App.css";
import { GameCanvas } from "./GameCanvas";

interface GameSettings {
  width: number;
  height: number;
  mines: number;
}

const Settings = ({
  onNewGame,
}: {
  onNewGame: (settings: GameSettings) => void;
}) => {
  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);

    const width = parseInt(String(data.get("width")), 10);
    const height = parseInt(String(data.get("height")), 10);
    const mines = parseInt(String(data.get("mines")), 10);

    if (width > 0 && height > 0 && mines > 0 && mines < width * height) {
      onNewGame({ width, height, mines });
    }
  };

  return (
    <form onSubmit={onSubmit}>
      width:
      <input name="width" type="number" defaultValue="10" />
      height:
      <input name="height" type="number" defaultValue="10" />
      mines:
      <input name="mines" type="number" defaultValue="10" />
      <button type="submit">new game</button>
    </form>
  );
};

const App = () => {
  const [game, setGame] = useState(0);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    width: 10,
    height: 10,
    mines: 10,
  });

  const onNewGame = (settings: GameSettings) => {
    setGameSettings(settings);
    setGame((old) => old + 1);
  };

  return (
    <>
      <Settings onNewGame={onNewGame} />
      <GameCanvas key={game} {...gameSettings} />
    </>
  );
};

export default App;
