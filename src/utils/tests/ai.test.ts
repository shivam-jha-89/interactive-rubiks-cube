import { describe, it, expect } from 'vitest';
import { getBestMove } from '../ai';
import { createEmptyBoard } from '../gameLogic';
import { BoardState } from '../../types';

describe('AI Logic', () => {
  const createBoard = (): BoardState => createEmptyBoard();

  // Helper function to print board state for debugging
  const printBoard = (board: BoardState, title: string = 'Board State') => {
    console.log(`\n=== ${title} ===`);
    for (let z = 0; z < 4; z++) {
      console.log(`Layer ${z} (z=${z}):`);
      for (let y = 0; y < 4; y++) {
        const row = board[z][y].map(cell => cell || '.').join(' ');
        console.log(`  y=${y}: ${row}`);
      }
      console.log('       x=0 1 2 3');
    }
    console.log('');
  };

  it('should take a winning move immediately (Horizontal)', () => {
    const board = createBoard();
    // X has three in a row (4x4x4 board needs 4 in a row to win)
    board[0][0][0] = 'X';
    board[0][0][1] = 'X';
    board[0][0][2] = 'X';
    printBoard(board, 'Horizontal Win Test - X has XXX_');
    // AI (X) should take (3, 0, 0) to complete the line
    const move = getBestMove(board, 'X', 'Standard');
    console.log(`AI chose: x=${move?.x}, y=${move?.y}, z=${move?.z}`);
    expect(move).toEqual({ x: 3, y: 0, z: 0 });
  });

  it('should take a winning move immediately (Vertical/Pillar)', () => {
    const board = createBoard();
    // O has three in a pillar (z varies)
    board[0][0][0] = 'O';
    board[1][0][0] = 'O';
    board[2][0][0] = 'O';
    printBoard(board, 'Pillar Win Test - O has OOO_ vertically');
    // AI (O) should take (0, 0, 3) to complete the pillar
    const move = getBestMove(board, 'O', 'Standard');
    console.log(`AI chose: x=${move?.x}, y=${move?.y}, z=${move?.z}`);
    expect(move).toEqual({ x: 0, y: 0, z: 3 });
  });

  it('should block an opponent winning move', () => {
    const board = createBoard();
    // X is about to win on space diagonal
    board[0][0][0] = 'X';
    board[1][1][1] = 'X';
    board[2][2][2] = 'X';
    printBoard(board, 'Block Space Diagonal - X has XXX_ on diagonal');
    // AI (O) must block at (3, 3, 3)
    const move = getBestMove(board, 'O', 'Standard');
    console.log(`AI chose: x=${move?.x}, y=${move?.y}, z=${move?.z}`);
    expect(move).toEqual({ x: 3, y: 3, z: 3 });
  });

  it('should make a valid first move', () => {
    const board = createBoard();
    // First move should be valid (any position is fine on empty board)
    // Use lower depth for empty board to avoid timeout
    const move = getBestMove(board, 'O', 'Standard', 2);
    // Just verify it returns a valid move
    expect(move).toBeDefined();
    expect(move?.x).toBeGreaterThanOrEqual(0);
    expect(move?.x).toBeLessThan(4);
    expect(move?.y).toBeGreaterThanOrEqual(0);
    expect(move?.y).toBeLessThan(4);
    expect(move?.z).toBeGreaterThanOrEqual(0);
    expect(move?.z).toBeLessThan(4);
  });

  it('should return valid move when board is nearly full', () => {
      const board = createBoard();
      // Fill almost all cells (4x4x4 = 64 cells)
      let count = 0;
      for(let z=0; z<4; z++) {
          for(let y=0; y<4; y++) {
              for(let x=0; x<4; x++) {
                  if (count < 63) {
                      board[z][y][x] = count % 2 === 0 ? 'X' : 'O';
                  }
                  count++;
              }
          }
      }
      // One spot left at (3, 3, 3)
      const move = getBestMove(board, 'X', 'Standard');
      expect(move).toEqual({ x: 3, y: 3, z: 3 });
  });

  it('should prioritize blocking a Layer 1 win even if Layer 2 looks attractive', () => {
    const board = createBoard();
    
    // User (O) has 3 pieces in a row on Layer 0 (z=0)
    board[0][0][0] = 'O';
    board[0][0][1] = 'O';
    board[0][0][2] = 'O';
    // Empty spot at (3, 0, 0) - Winning for O
    
    // AI has a piece elsewhere as distraction
    board[1][1][1] = 'X'; 

    printBoard(board, 'User Reported Issue - O has OOO_ on layer 0');
    const move = getBestMove(board, 'X', 'Standard');
    console.log(`AI chose: x=${move?.x}, y=${move?.y}, z=${move?.z}`);
    expect(move).toEqual({ x: 3, y: 0, z: 0 });
  });

   it('should handle Gravity mode blocking correctly', () => {
    const board = createBoard();
    // Gravity mode: can only place on z=0 or above another piece.
    
    // User (O) about to win on bottom layer
    board[0][0][0] = 'O';
    board[0][0][1] = 'O';
    board[0][0][2] = 'O';
    
    const move = getBestMove(board, 'X', 'Gravity');
    expect(move).toEqual({ x: 3, y: 0, z: 0 });
  });

  it('should prioritize blocking immediate win over creating a fork', () => {
    const board = createBoard();
    // User (O) about to win
    board[0][0][0] = 'O';
    board[0][0][1] = 'O';
    board[0][0][2] = 'O';

    // AI (X) could create a fork elsewhere
    board[1][1][1] = 'X';

    const move = getBestMove(board, 'X', 'Standard');
    // Must block at (3, 0, 0)
    expect(move).toEqual({ x: 3, y: 0, z: 0 });
  });

  it('should block horizontal line XX_X pattern', () => {
    const board = createBoard();
    // User (X) has XX_X pattern on bottom layer
    board[0][0][0] = 'X';
    board[0][0][1] = 'X';
    board[0][0][3] = 'X';
    printBoard(board, 'Block XX_X Pattern');
    // AI (O) must block at (2, 0, 0)
    const move = getBestMove(board, 'O', 'Standard');
    console.log(`AI chose: x=${move?.x}, y=${move?.y}, z=${move?.z}`);
    expect(move).toEqual({ x: 2, y: 0, z: 0 });
  });

  it('should block vertical line X_XX pattern', () => {
    const board = createBoard();
    // User (O) has O_OO pattern vertically
    board[0][0][0] = 'O';
    board[2][0][0] = 'O';
    board[3][0][0] = 'O';
    // AI (X) must block at (0, 0, 1)
    const move = getBestMove(board, 'X', 'Standard');
    expect(move).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('should block diagonal line in xy plane', () => {
    const board = createBoard();
    // User (X) has diagonal XXX_ on z=0
    board[0][0][0] = 'X';
    board[0][1][1] = 'X';
    board[0][2][2] = 'X';
    // AI (O) must block at (3, 3, 0)
    const move = getBestMove(board, 'O', 'Standard');
    expect(move).toEqual({ x: 3, y: 3, z: 0 });
  });

  it('should block space diagonal', () => {
    const board = createBoard();
    // User (O) has space diagonal _OOO
    board[1][1][1] = 'O';
    board[2][2][2] = 'O';
    board[3][3][3] = 'O';
    // AI (X) must block at (0, 0, 0)
    const move = getBestMove(board, 'X', 'Standard');
    expect(move).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('should block when opponent has _XXX pattern', () => {
    const board = createBoard();
    // User (X) has _XXX pattern
    board[0][0][1] = 'X';
    board[0][0][2] = 'X';
    board[0][0][3] = 'X';
    // AI (O) must block at (0, 0, 0)
    const move = getBestMove(board, 'O', 'Standard');
    expect(move).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('should prioritize winning over blocking', () => {
    const board = createBoard();
    // AI (X) can win
    board[0][0][0] = 'X';
    board[0][0][1] = 'X';
    board[0][0][2] = 'X';
    // User (O) also about to win elsewhere
    board[1][0][0] = 'O';
    board[1][0][1] = 'O';
    board[1][0][2] = 'O';
    // AI should take the win at (3, 0, 0)
    const move = getBestMove(board, 'X', 'Standard');
    expect(move).toEqual({ x: 3, y: 0, z: 0 });
  });

  it('should block column pattern', () => {
    const board = createBoard();
    // User (O) has OOO_ in column (y varies)
    board[0][0][0] = 'O';
    board[0][1][0] = 'O';
    board[0][2][0] = 'O';
    // AI (X) must block at (0, 3, 0)
    const move = getBestMove(board, 'X', 'Standard');
    expect(move).toEqual({ x: 0, y: 3, z: 0 });
  });
});
