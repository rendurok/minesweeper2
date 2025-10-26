export type Coordinates = [number, number];

export const enum TileState {
  HIDDEN,
  VISIBLE,
  FLAGGED,
}

export interface Tile {
  /** -1 means mine */
  number: number;
  state: TileState;
}

export interface GameSettings {
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

export const enum GameState {
  NOT_INITIALIZED,
  IN_PROGRESS,
  WON,
  LOST,
}

export class GameManager {
  private field: Tile[][];
  private mines = 0;
  private flags = 0;
  private revealed = 0;
  private state = GameState.NOT_INITIALIZED;

  private drawTile: (tile: Tile, coordinates: Coordinates) => void;
  private onGameEnd: () => void;

  public constructor(
    drawtile: typeof this.drawTile,
    onGameEnd: typeof this.onGameEnd
  ) {
    this.drawTile = drawtile;
    this.onGameEnd = onGameEnd;
    this.field = [];
  }

  public getHeight(): number {
    return this.field.length;
  }

  public getWidth(): number {
    return this.field[0]?.length ?? 0;
  }

  public getMines(): number {
    return this.mines;
  }

  public getFlags(): number {
    return this.flags;
  }

  public getRevealed(): number {
    return this.revealed;
  }

  public getState(): number {
    return this.state;
  }

  public drawGrid(): void {
    for (let y = 0; y < this.getHeight(); y++)
      for (let x = 0; x < this.getWidth(); x++)
        this.drawTile(this.field[y][x], [y, x]);
  }

  public reset(width: number, height: number, mines: number): void {
    this.mines = mines;
    this.flags = 0;
    this.revealed = 0;
    this.state = GameState.NOT_INITIALIZED;
    this.field = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({
        number: 0,
        state: TileState.HIDDEN,
      }))
    );

    this.drawGrid();
  }

  private placeMines([startY, startX]: Coordinates): void {
    const height = this.getHeight();
    const width = this.getWidth();

    for (let mine = 0; mine < this.mines; mine++) {
      let y: number, x: number;
      do {
        y = Math.floor(Math.random() * height);
        x = Math.floor(Math.random() * width);
      } while (
        (y === startY && x === startX) ||
        this.field[y][x].number === -1
      );

      this.field[y][x].number = -1;

      for (const [neighborY, neighborX] of neighbors([y, x])) {
        const neighbor = this.field[neighborY]?.[neighborX];
        if (neighbor && neighbor.number !== -1) neighbor.number++;
      }
    }

    this.state = GameState.IN_PROGRESS;
  }

  private flood(coordinates: Coordinates): void {
    const stack = [coordinates];

    while (true) {
      const next = stack.pop();
      if (next === undefined) return;
      const tile = this.field[next[0]]?.[next[1]];

      if (tile && tile.state === TileState.HIDDEN) {
        if (tile.number === -1) {
          this.state = GameState.LOST;
        }

        tile.state = TileState.VISIBLE;
        this.drawTile(tile, next);
        this.revealed++;

        if (tile.number === 0) {
          stack.push(...neighbors(next));
        }
      }
    }
  }

  public reveal(coordinates: Coordinates) {
    if (this.revealed === 0) {
      this.placeMines(coordinates);
    }

    const tile = this.field[coordinates[0]]?.[coordinates[1]];
    if (!tile || tile.state === TileState.FLAGGED) return;

    if (tile.state === TileState.VISIBLE) {
      if (
        tile.number > 0 &&
        tile.number ===
          neighbors(coordinates)
            .map<number>(([y, x]) =>
              this.field[y]?.[x]?.state === TileState.FLAGGED ? 1 : 0
            )
            .reduce((a, b) => a + b, 0)
      ) {
        for (const neighbor of neighbors(coordinates)) {
          if (
            this.field[neighbor[0]]?.[neighbor[1]]?.state === TileState.HIDDEN
          ) {
            this.flood(neighbor);
          }
        }
      }
    } else {
      this.flood(coordinates);
    }

    if (this.state === GameState.LOST) {
      this.onGameEnd();
    } else if (
      this.mines + this.revealed ===
      this.getWidth() * this.getHeight()
    ) {
      this.state = GameState.WON;
      this.onGameEnd();
    }
  }

  public toggleFlag([y, x]: Coordinates) {
    const tile = this.field[y]?.[x];
    if (tile) {
      tile.state = getNewFlagState(tile.state);

      if (tile.state === TileState.FLAGGED) this.flags++;
      else if (tile.state === TileState.HIDDEN) this.flags--;

      this.drawTile(tile, [y, x]);
    }
  }
}
