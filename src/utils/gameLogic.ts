import { BoardState, CellValue, Coordinate, Player, GameMode } from '../types';

// Cache winning lines for each size to avoid recalculating
const WINNING_LINES_CACHE: Record<number, Coordinate[][]> = {};

export function createEmptyBoard(size: number = 4): BoardState {
  const board: BoardState = [];
  for (let z = 0; z < size; z++) {
    const layer: CellValue[][] = [];
    for (let y = 0; y < size; y++) {
      const row: CellValue[] = [];
      for (let x = 0; x < size; x++) {
        row.push(null);
      }
      layer.push(row);
    }
    board.push(layer);
  }
  return board;
}

// Generate all winning lines coordinates for a specific board size
export const generateWinningLines = (size: number): Coordinate[][] => {
  if (WINNING_LINES_CACHE[size]) {
    return WINNING_LINES_CACHE[size];
  }

  const lines: Coordinate[][] = [];

  // 1. Rows (x varies, y & z fixed)
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      const line: Coordinate[] = [];
      for (let x = 0; x < size; x++) {
        line.push({ x, y, z });
      }
      lines.push(line);
    }
  }

  // 2. Columns (y varies, x & z fixed)
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const line: Coordinate[] = [];
      for (let y = 0; y < size; y++) {
        line.push({ x, y, z });
      }
      lines.push(line);
    }
  }

  // 3. Pillars (z varies, x & y fixed)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const line: Coordinate[] = [];
      for (let z = 0; z < size; z++) {
        line.push({ x, y, z });
      }
      lines.push(line);
    }
  }

  // 4. Diagonals in xy planes (z fixed)
  for (let z = 0; z < size; z++) {
    const d1: Coordinate[] = [];
    const d2: Coordinate[] = [];
    for (let i = 0; i < size; i++) {
      d1.push({ x: i, y: i, z });
      d2.push({ x: i, y: size - 1 - i, z });
    }
    lines.push(d1, d2);
  }

  // 5. Diagonals in xz planes (y fixed)
  for (let y = 0; y < size; y++) {
    const d1: Coordinate[] = [];
    const d2: Coordinate[] = [];
    for (let i = 0; i < size; i++) {
      d1.push({ x: i, y, z: i });
      d2.push({ x: i, y, z: size - 1 - i });
    }
    lines.push(d1, d2);
  }

  // 6. Diagonals in yz planes (x fixed)
  for (let x = 0; x < size; x++) {
    const d1: Coordinate[] = [];
    const d2: Coordinate[] = [];
    for (let i = 0; i < size; i++) {
      d1.push({ x, y: i, z: i });
      d2.push({ x, y: i, z: size - 1 - i });
    }
    lines.push(d1, d2);
  }

  // 7. Space diagonals
  const sd1: Coordinate[] = [];
  const sd2: Coordinate[] = [];
  const sd3: Coordinate[] = [];
  const sd4: Coordinate[] = [];
  
  for (let i = 0; i < size; i++) {
    sd1.push({ x: i, y: i, z: i });
    sd2.push({ x: i, y: i, z: size - 1 - i });
    sd3.push({ x: i, y: size - 1 - i, z: i });
    sd4.push({ x: i, y: size - 1 - i, z: size - 1 - i });
  }
  lines.push(sd1, sd2, sd3, sd4);

  WINNING_LINES_CACHE[size] = lines;
  return lines;
};

export function checkWinner(board: BoardState): Player | null {
  const size = board.length;
  const winningLines = generateWinningLines(size);

  for (const line of winningLines) {
    const firstCell = board[line[0].z][line[0].y][line[0].x];
    if (!firstCell) continue;
    
    let isWin = true;
    for (let i = 1; i < line.length; i++) {
      const cell = board[line[i].z][line[i].y][line[i].x];
      if (cell !== firstCell) {
        isWin = false;
        break;
      }
    }
    
    if (isWin) return firstCell;
  }
  return null;
}

export function isBoardFull(board: BoardState): boolean {
  const size = board.length;
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[z][y][x] === null) return false;
      }
    }
  }
  return true;
}

export function getEmptyCells(board: BoardState): Coordinate[] {
  const size = board.length;
  const cells: Coordinate[] = [];
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[z][y][x] === null) {
          cells.push({ x, y, z });
        }
      }
    }
  }
  return cells;
}

export function isValidMove(board: BoardState, { x, y, z }: Coordinate, mode: GameMode): boolean {
  const size = board.length;
  if (x < 0 || x >= size || y < 0 || y >= size || z < 0 || z >= size) return false;
  if (board[z][y][x] !== null) return false;

  if (mode === 'Gravity') {
    // Must be on bottom layer OR have a piece below it
    if (z === 0) return true;
    return board[z - 1][y][x] !== null;
  }

  return true;
}

export function getValidMoves(board: BoardState, mode: GameMode): Coordinate[] {
  const emptyCells = getEmptyCells(board);
  return emptyCells.filter(cell => isValidMove(board, cell, mode));
}

// Apply gravity: make pieces fall down to fill empty spaces below
export function applyGravity(board: BoardState): BoardState {
  const size = board.length;
  const newBoard = board.map(layer => layer.map(row => [...row]));
  
  // For each column (x, y), move pieces down
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      // Collect all non-null pieces in this column from bottom to top
      const column: CellValue[] = [];
      for (let z = 0; z < size; z++) {
        if (newBoard[z][y][x] !== null) {
          column.push(newBoard[z][y][x]);
        }
      }
      
      // Clear the column
      for (let z = 0; z < size; z++) {
        newBoard[z][y][x] = null;
      }
      
      // Place pieces back from bottom up
      for (let i = 0; i < column.length; i++) {
        newBoard[i][y][x] = column[i];
      }
    }
  }
  
  return newBoard;
}

// Check for all explosions on the board (not just from last move)
export function checkAllExplosions(board: BoardState): Coordinate[] {
  const size = board.length;
  const explodedCells: Coordinate[] = [];
  const checked = new Set<string>();
  
  // Helper to create a unique key for a coordinate
  const coordKey = (c: Coordinate) => `${c.x},${c.y},${c.z}`;
  
  // Check each cell for potential explosions
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const player = board[z][y][x];
        if (!player) continue;
        
        const coord = { x, y, z };
        const key = coordKey(coord);
        if (checked.has(key)) continue;
        
        // Check all directions from this cell
        const directions = [
          { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 },
          { x: 1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 },
          { x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 },
          { x: 0, y: 1, z: 1 }, { x: 0, y: 1, z: -1 },
          { x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: -1 }, { x: 1, y: -1, z: 1 }, { x: 1, y: -1, z: -1 }
        ];
        
        for (const dir of directions) {
          const line: Coordinate[] = [coord];
          const opponents: Coordinate[] = [];
          
          // Check forward
          let current = { x: coord.x + dir.x, y: coord.y + dir.y, z: coord.z + dir.z };
          while (
            current.x >= 0 && current.x < size &&
            current.y >= 0 && current.y < size &&
            current.z >= 0 && current.z < size &&
            board[current.z][current.y][current.x] === player
          ) {
            line.push({ ...current });
            current.x += dir.x;
            current.y += dir.y;
            current.z += dir.z;
          }
          
          // Check for adjacent opponent after forward loop
          if (
            current.x >= 0 && current.x < size &&
            current.y >= 0 && current.y < size &&
            current.z >= 0 && current.z < size
          ) {
            const cell = board[current.z][current.y][current.x];
            if (cell !== null && cell !== player) {
              opponents.push({ ...current });
            }
          }
          
          // Check backward
          current = { x: coord.x - dir.x, y: coord.y - dir.y, z: coord.z - dir.z };
          while (
            current.x >= 0 && current.x < size &&
            current.y >= 0 && current.y < size &&
            current.z >= 0 && current.z < size &&
            board[current.z][current.y][current.x] === player
          ) {
            line.push({ ...current });
            current.x -= dir.x;
            current.y -= dir.y;
            current.z -= dir.z;
          }
          
          // Check for adjacent opponent after backward loop
          if (
            current.x >= 0 && current.x < size &&
            current.y >= 0 && current.y < size &&
            current.z >= 0 && current.z < size
          ) {
            const cell = board[current.z][current.y][current.x];
            if (cell !== null && cell !== player) {
              opponents.push({ ...current });
            }
          }
          
          // If line length is exactly 3, mark all cells for explosion
          if (line.length === 3) {
            line.forEach(c => {
              const k = coordKey(c);
              if (!checked.has(k)) {
                explodedCells.push(c);
                checked.add(k);
              }
            });
            opponents.forEach(c => {
              const k = coordKey(c);
              if (!checked.has(k)) {
                explodedCells.push(c);
                checked.add(k);
              }
            });
          }
        }
      }
    }
  }
  
  return explodedCells;
}

export function checkExplosion(board: BoardState, lastMove: Coordinate): Coordinate[] {
  const size = board.length;
  const player = board[lastMove.z][lastMove.y][lastMove.x];
  if (!player) return [];

  const explodedCells: Coordinate[] = [];
  const directions = [
    { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 },
    { x: 1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 },
    { x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 },
    { x: 0, y: 1, z: 1 }, { x: 0, y: 1, z: -1 },
    { x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: -1 }, { x: 1, y: -1, z: 1 }, { x: 1, y: -1, z: -1 }
  ];

  for (const dir of directions) {
    const line: Coordinate[] = [lastMove];
    const opponents: Coordinate[] = [];
    
    // Check forward
    let current = { x: lastMove.x + dir.x, y: lastMove.y + dir.y, z: lastMove.z + dir.z };
    while (
      current.x >= 0 && current.x < size &&
      current.y >= 0 && current.y < size &&
      current.z >= 0 && current.z < size &&
      board[current.z][current.y][current.x] === player
    ) {
      line.push({ ...current });
      current.x += dir.x;
      current.y += dir.y;
      current.z += dir.z;
    }

    // Check for adjacent opponent after forward loop
    if (
      current.x >= 0 && current.x < size &&
      current.y >= 0 && current.y < size &&
      current.z >= 0 && current.z < size
    ) {
      const cell = board[current.z][current.y][current.x];
      // If cell is not null and not player, it must be opponent
      if (cell !== null && cell !== player) {
        opponents.push({ ...current });
      }
    }

    // Check backward
    current = { x: lastMove.x - dir.x, y: lastMove.y - dir.y, z: lastMove.z - dir.z };
    while (
      current.x >= 0 && current.x < size &&
      current.y >= 0 && current.y < size &&
      current.z >= 0 && current.z < size &&
      board[current.z][current.y][current.x] === player
    ) {
      line.push({ ...current });
      current.x -= dir.x;
      current.y -= dir.y;
      current.z -= dir.z;
    }

    // Check for adjacent opponent after backward loop
    if (
      current.x >= 0 && current.x < size &&
      current.y >= 0 && current.y < size &&
      current.z >= 0 && current.z < size
    ) {
      const cell = board[current.z][current.y][current.x];
      if (cell !== null && cell !== player) {
        opponents.push({ ...current });
      }
    }

    // If line length is exactly 3, it explodes
    if (line.length === 3) {
      explodedCells.push(...line);
      explodedCells.push(...opponents);
    }
  }

  return explodedCells;
}

// Process explosion cascade for gravity mode: explode, apply gravity, check for chain reactions
export function processGravityCascade(board: BoardState, initialExploded: Coordinate[]): { board: BoardState; allExploded: Coordinate[] } {
  let currentBoard = board.map(layer => layer.map(row => [...row]));
  const allExploded: Coordinate[] = [];
  const explodedSet = new Set<string>();
  
  const coordKey = (c: Coordinate) => `${c.x},${c.y},${c.z}`;
  
  // Add initial exploded cells
  initialExploded.forEach(c => {
    const key = coordKey(c);
    if (!explodedSet.has(key)) {
      allExploded.push(c);
      explodedSet.add(key);
    }
  });
  
  // Remove initial exploded cells
  initialExploded.forEach(c => {
    currentBoard[c.z][c.y][c.x] = null;
  });
  
  // Apply gravity and check for chain reactions
  let hasMoreExplosions = true;
  while (hasMoreExplosions) {
    // Apply gravity
    currentBoard = applyGravity(currentBoard);
    
    // Check for new explosions
    const newExplosions = checkAllExplosions(currentBoard);
    
    if (newExplosions.length === 0) {
      hasMoreExplosions = false;
    } else {
      // Add new explosions to the list
      newExplosions.forEach(c => {
        const key = coordKey(c);
        if (!explodedSet.has(key)) {
          allExploded.push(c);
          explodedSet.add(key);
        }
      });
      
      // Remove exploded cells
      newExplosions.forEach(c => {
        currentBoard[c.z][c.y][c.x] = null;
      });
    }
  }
  
  return { board: currentBoard, allExploded };
}
