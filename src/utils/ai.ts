import { BoardState, Coordinate, Player, GameMode } from '../types';
import { getValidMoves, checkWinner, isBoardFull, checkExplosion, generateWinningLines } from './gameLogic';

// Cache position weights for each size
const WEIGHTS_CACHE: Record<number, number[][][]> = {};

// Pre-calculate position weights based on winning line participation
// This helps the AI prioritize center and corners which are involved in more winning lines
const getPositionWeights = (size: number): number[][][] => {
  if (WEIGHTS_CACHE[size]) {
    return WEIGHTS_CACHE[size];
  }

  const weights = Array(size).fill(0).map(() =>
    Array(size).fill(0).map(() => Array(size).fill(0))
  );

  const lines = generateWinningLines(size);
  for (const line of lines) {
    for (const {x, y, z} of line) {
      weights[z][y][x]++;
    }
  }
  
  WEIGHTS_CACHE[size] = weights;
  return weights;
};

// Improved Heuristic evaluation
// Returns +ve score for 'X' advantage, -ve score for 'O' advantage
function evaluateBoard(board: BoardState): number {
  const size = board.length;
  const positionWeights = getPositionWeights(size);
  const winningLines = generateWinningLines(size);
  
  let score = 0;
  let xThreats = 0;
  let oThreats = 0;

  // 1. Material / Position Score
  // Add bonus for occupying strategic cells (Center > Corners > Edges)
  for(let z=0; z<size; z++) {
      for(let y=0; y<size; y++) {
          for(let x=0; x<size; x++) {
              const cell = board[z][y][x];
              if (cell === 'X') score += positionWeights[z][y][x];
              else if (cell === 'O') score -= positionWeights[z][y][x];
          }
      }
  }

  // 2. Line Score (Threats and Potentials)
  for (const line of winningLines) {
    let xCount = 0;
    let oCount = 0;

    for (const coord of line) {
      const cell = board[coord.z][coord.y][coord.x];
      if (cell === 'X') xCount++;
      else if (cell === 'O') oCount++;
    }

    // Only score lines that are possible to win (not blocked)
    if (xCount > 0 && oCount === 0) {
      if (xCount === size) score += 100000; // Winning line
      else if (xCount === size - 1) {
        score += 1000; // Strong threat
        xThreats++;
      }
      else if (xCount > 0) score += 10; // Potential
    } else if (oCount > 0 && xCount === 0) {
      if (oCount === size) score -= 100000;
      else if (oCount === size - 1) {
        score -= 1000; // Strong threat
        oThreats++;
      }
      else if (oCount > 0) score -= 10; // Potential
    }
  }

  // 3. Fork Detection (Multiple Threats)
  // If a player has 2+ threats, they are in a very strong position (likely winning)
  if (xThreats >= 2) score += 50000;
  if (oThreats >= 2) score -= 50000;

  return score;
}

// Minimax with Alpha-Beta Pruning and Backtracking
export function getBestMove(board: BoardState, player: Player, mode: GameMode, depth: number = 5): Coordinate | null {
  const size = board.length;
  const positionWeights = getPositionWeights(size);

  // Create a working copy of the board
  const workingBoard = board.map(layer => layer.map(row => [...row]));
  
  const validMoves = getValidMoves(workingBoard, mode);
  if (validMoves.length === 0) return null;

  // 0. Instant Win Check (Lookahead Depth 1)
  // Always take a win if available immediately.
  for (const move of validMoves) {
    workingBoard[move.z][move.y][move.x] = player;
    if (checkWinner(workingBoard) === player) {
      return move;
    }
    workingBoard[move.z][move.y][move.x] = null; // Undo
  }

  // 1. Block Opponent's Winning Move
  // Check if opponent can win on their next move and block it.
  const opponent: Player = player === 'X' ? 'O' : 'X';
  for (const move of validMoves) {
    workingBoard[move.z][move.y][move.x] = opponent;
    if (checkWinner(workingBoard) === opponent) {
      workingBoard[move.z][move.y][move.x] = null;
      return move;
    }
    workingBoard[move.z][move.y][move.x] = null; // Undo
  }

  // Move Ordering Optimization:
  // Sort moves by position weight (highest first) to maximize alpha-beta pruning efficiency.
  validMoves.sort((a, b) => {
    const weightA = positionWeights[a.z][a.y][a.x];
    const weightB = positionWeights[b.z][b.y][b.x];
    return weightB - weightA;
  });

  let bestScore = player === 'X' ? -Infinity : Infinity;
  let bestMove: Coordinate | null = null;
  let alpha = -Infinity;
  let beta = Infinity;

  const isMaximizing = player === 'X';

  for (const cell of validMoves) {
    // Make move
    workingBoard[cell.z][cell.y][cell.x] = player;

    // Check explosion
    const exploded = checkExplosion(workingBoard, cell);
    exploded.forEach(c => workingBoard[c.z][c.y][c.x] = null);

    const score = minimax(workingBoard, depth - 1, alpha, beta, !isMaximizing, mode);
    
    // Undo move
    exploded.forEach(c => workingBoard[c.z][c.y][c.x] = player);
    workingBoard[cell.z][cell.y][cell.x] = null;

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = cell;
      }
      alpha = Math.max(alpha, score);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = cell;
      }
      beta = Math.min(beta, score);
    }

    if (beta <= alpha) break;
  }

  return bestMove || validMoves[0];
}

function minimax(
  board: BoardState, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean,
  mode: GameMode
): number {
  const winner = checkWinner(board);
  // Prefer winning sooner (+depth) and losing later (-depth)
  if (winner === 'X') return 100000 + depth;
  if (winner === 'O') return -100000 - depth;
  if (isBoardFull(board)) return 0;
  if (depth === 0) return evaluateBoard(board);

  const size = board.length;
  const positionWeights = getPositionWeights(size);

  const validMoves = getValidMoves(board, mode);
  
  // Sort moves
  validMoves.sort((a, b) => positionWeights[b.z][b.y][b.x] - positionWeights[a.z][a.y][a.x]);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const cell of validMoves) {
      board[cell.z][cell.y][cell.x] = 'X';
      
      const exploded = checkExplosion(board, cell);
      exploded.forEach(c => board[c.z][c.y][c.x] = null);

      const evalScore = minimax(board, depth - 1, alpha, beta, false, mode);
      
      exploded.forEach(c => board[c.z][c.y][c.x] = 'X');
      board[cell.z][cell.y][cell.x] = null;
      
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const cell of validMoves) {
      board[cell.z][cell.y][cell.x] = 'O';

      const exploded = checkExplosion(board, cell);
      exploded.forEach(c => board[c.z][c.y][c.x] = null);

      const evalScore = minimax(board, depth - 1, alpha, beta, true, mode);
      
      exploded.forEach(c => board[c.z][c.y][c.x] = 'O');
      board[cell.z][cell.y][cell.x] = null;
      
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
