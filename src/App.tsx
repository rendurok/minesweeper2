import { useState, type FormEvent } from "react";
import "./App.css";

type Coordinates = [number, number];

const enum TileState {
  HIDDEN = 0,
  VISIBLE = 1,
  FLAGGED = 2,
}

interface Tile {
  /** -1 means mine */
  number: number;
  state: TileState;
}

interface GameSettings {
  width: number;
  height: number;
  mines: number;
}

const neighbors = ([y, x]: Coordinates): Coordinates[] => {
  return [
    [y - 1, x - 1],
    [y - 1, x],
    [y - 1, x + 1],
    [y, x - 1],
    [y, x + 1],
    [y + 1, x - 1],
    [y + 1, x],
    [y + 1, x + 1],
  ];
};

const generateField = (width: number, height: number): Tile[][] => {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      number: 0,
      state: TileState.HIDDEN,
    }))
  );
};

const placeMines = (
  field: Tile[][],
  mines: number,
  [startY, startX]: Coordinates
): void => {
  const height = field.length;
  const width = field[0].length;

  for (let mine = 0; mine < mines; mine++) {
    let y: number, x: number;
    do {
      y = Math.floor(Math.random() * height);
      x = Math.floor(Math.random() * width);
    } while ((y === startY && x === startX) || field[y][x].number === -1);

    field[y][x].number = -1;

    for (const [neighborY, neighborX] of neighbors([y, x])) {
      const neighbor = field[neighborY]?.[neighborX];
      if (neighbor && neighbor.number !== -1) neighbor.number++;
    }
  }
};

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

const getNumberText = (number: number): string => {
  switch (number) {
    case -1:
      return "b";
    case 0:
      return "";
    default:
      return String(number);
  }
};

const getTileText = (state: TileState, number: number): string => {
  switch (state) {
    case TileState.HIDDEN:
      return "";
    case TileState.VISIBLE:
      return getNumberText(number);
    case TileState.FLAGGED:
      return "f";
  }
};

const Square = ({
  number,
  state,
  onReveal,
  onFlag,
}: Tile & {
  onReveal: () => void;
  onFlag: () => void;
}) => (
  <div
    style={{
      width: "20px",
      height: "20px",
      backgroundColor: state === TileState.VISIBLE ? "white" : "gray",
      border: "1px solid black",
      flexShrink: 0,
    }}
    onMouseDown={(ev) => {
      ev.preventDefault();
      if (ev.button === 0) onReveal();
      else if (ev.button === 2) onFlag();
    }}
    onContextMenu={(ev) => ev.preventDefault()}
  >
    {getTileText(state, number)}
  </div>
);

const reveal = (field: Tile[][], coordinates: Coordinates): void => {
  const stack = [coordinates];

  while (true) {
    const next = stack.pop();
    if (next === undefined) return;
    const tile = field[next[0]]?.[next[1]];

    if (tile && tile.state === TileState.HIDDEN) {
      if (tile.number === -1) {
        alert("you lost");
        return;
      }
      tile.state = TileState.VISIBLE;
      if (tile.number === 0) {
        stack.push(...neighbors(next));
      }
    }
  }
};

const getNewFlagState = (oldState: TileState) => {
  switch (oldState) {
    case TileState.HIDDEN:
      return TileState.FLAGGED;
    case TileState.VISIBLE:
      return TileState.VISIBLE;
    case TileState.FLAGGED:
      return TileState.HIDDEN;
  }
};

const App = () => {
  const [field, setField] = useState<Tile[][]>(generateField(10, 10));
  const [gameStarted, setGameStarted] = useState(false);
  const [{ width, height, mines }, setGameSettings] = useState<GameSettings>({
    width: 10,
    height: 10,
    mines: 10,
  });

  const onNewGame = (settings: GameSettings) => {
    setGameStarted(false);
    setGameSettings(settings);
    setField(generateField(settings.width, settings.height));
  };

  const onReveal = (coordinates: Coordinates) => {
    const fieldCopy = field.map((row) => row.slice());
    if (!gameStarted) {
      placeMines(fieldCopy, mines, coordinates);
      setGameStarted(true);
    }
    const tile = field[coordinates[0]]?.[coordinates[1]];
    if (!tile || tile.state === TileState.FLAGGED) return;

    if (tile.state === TileState.VISIBLE) {
      if (
        tile.number > 0 &&
        tile.number ===
          neighbors(coordinates)
            .map<number>(([y, x]) =>
              field[y]?.[x]?.state === TileState.FLAGGED ? 1 : 0
            )
            .reduce((a, b) => a + b, 0)
      ) {
        for (const neighbor of neighbors(coordinates)) {
          if (field[neighbor[0]]?.[neighbor[1]]?.state === TileState.HIDDEN) {
            reveal(fieldCopy, neighbor);
          }
        }
      }
    } else {
      reveal(field, coordinates);
    }

    setField(fieldCopy);
  };

  const onFlag = ([flagY, flagX]: Coordinates) =>
    setField((prev) =>
      prev.map((row, y) =>
        row.map((tile, x) =>
          y === flagY && x === flagX
            ? { ...tile, state: getNewFlagState(tile.state) }
            : tile
        )
      )
    );

  return (
    <>
      <Settings onNewGame={onNewGame} />
      {field.map((row, y) => (
        <div style={{ display: "flex", flexDirection: "row" }} key={y}>
          {row.map((tile, x) => {
            return (
              <Square
                key={x}
                {...tile}
                onReveal={() => onReveal([y, x])}
                onFlag={() => onFlag([y, x])}
              />
            );
          })}
        </div>
      ))}
    </>
  );
};

export default App;
