import { useEffect, useRef } from "react";
import {
  GameManager,
  GameState,
  TileState,
  type Coordinates,
  type GameSettings,
  type Tile,
} from "./GameManager";

const cellWidth = 20;
const cellHeight = 20;

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

const getGameEndText = (state: GameState) => {
  switch (state) {
    case GameState.WON:
      return "won";
    case GameState.LOST:
      return "lost";
    default:
      return "ended";
  }
};

const drawCell = (
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  [row, col]: Coordinates
) => {
  const x = col * cellWidth;
  const y = row * cellHeight;

  ctx.fillStyle = tile.state === TileState.VISIBLE ? "white" : "gray";
  ctx.fillRect(x, y, cellWidth, cellHeight);

  ctx.strokeStyle = "#333";
  ctx.strokeRect(x, y, cellWidth, cellHeight);

  ctx.fillStyle = "#000";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    getTileText(tile.state, tile.number),
    x + cellWidth / 2,
    y + cellHeight / 2
  );
};

export const GameCanvas = ({ width, height, mines }: GameSettings) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const gameRef = useRef<GameManager | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) throw new Error("no canvas");

    const ctx = canvas.getContext("2d");
    if (ctx === null) throw new Error("no ctx");

    ctx.clearRect(0, 0, width * cellWidth, height * cellHeight);

    const game = new GameManager(
      (tile, coords) => drawCell(ctx, tile, coords),
      () => alert("game " + getGameEndText(game.getState()))
    );
    game.reset(width, height, mines);

    ctxRef.current = ctx;
    gameRef.current = game;

    const handleClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect) return;

      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const col = Math.floor(x / cellWidth);
      const row = Math.floor(y / cellHeight);

      if (ev.button === 0) game.reveal([row, col]);
      if (ev.button === 2) game.toggleFlag([row, col]);
    };

    canvas.addEventListener("mousedown", handleClick);
    return () => canvas.removeEventListener("mousedown", handleClick);
  }, [width, height, mines]);

  return (
    <canvas
      onContextMenu={(ev) => ev.preventDefault()}
      ref={canvasRef}
      width={width * cellWidth}
      height={height * cellHeight}
    />
  );
};
