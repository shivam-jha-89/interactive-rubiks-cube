export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type BoardState = CellValue[][][]; // [z][y][x]
export type Coordinate = { x: number; y: number; z: number };
export type GameMode = 'Standard' | 'Gravity';
