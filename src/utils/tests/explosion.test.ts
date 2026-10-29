import { describe, it, expect } from 'vitest';
import { createEmptyBoard, checkExplosion } from '../gameLogic';
import { Player } from '../../types';

describe('Explosion Logic', () => {
  const setupBoard = (coords: {x: number, y: number, z: number, p: Player}[]) => {
    const board = createEmptyBoard();
    coords.forEach(c => {
      board[c.z][c.y][c.x] = c.p;
    });
    return board;
  };

  it('should explode line of 3 and include adjacent opponent (start of line)', () => {
    // O X X X
    // X at 1, 2, 3. O at 0.
    // Last move at 3 (making the 3rd X)
    const board = setupBoard([
      {x:0, y:0, z:0, p: 'O'},
      {x:1, y:0, z:0, p: 'X'},
      {x:2, y:0, z:0, p: 'X'},
      {x:3, y:0, z:0, p: 'X'}
    ]);

    const lastMove = {x:3, y:0, z:0};
    const exploded = checkExplosion(board, lastMove);
    
    // Expect 3 Xs and 1 O
    expect(exploded.length).toBe(4);
    expect(exploded).toContainEqual({x:0, y:0, z:0}); // The opponent
    expect(exploded).toContainEqual({x:1, y:0, z:0});
    expect(exploded).toContainEqual({x:2, y:0, z:0});
    expect(exploded).toContainEqual({x:3, y:0, z:0});
  });

  it('should explode line of 3 and include adjacent opponent (end of line)', () => {
    // X X X O
    // X at 0, 1, 2. O at 3.
    // Last move at 2
    const board = setupBoard([
      {x:0, y:0, z:0, p: 'X'},
      {x:1, y:0, z:0, p: 'X'},
      {x:2, y:0, z:0, p: 'X'},
      {x:3, y:0, z:0, p: 'O'}
    ]);

    const lastMove = {x:2, y:0, z:0};
    const exploded = checkExplosion(board, lastMove);
    
    expect(exploded.length).toBe(4);
    expect(exploded).toContainEqual({x:3, y:0, z:0}); // The opponent
  });

  it('should explode line of 3 but NOT include adjacent empty cell', () => {
    // . X X X
    // X at 1, 2, 3.
    const board = setupBoard([
      {x:1, y:0, z:0, p: 'X'},
      {x:2, y:0, z:0, p: 'X'},
      {x:3, y:0, z:0, p: 'X'}
    ]);

    const lastMove = {x:3, y:0, z:0};
    const exploded = checkExplosion(board, lastMove);
    
    expect(exploded.length).toBe(3);
    expect(exploded).not.toContainEqual({x:0, y:0, z:0});
  });

  it('should explode line of 3 and include adjacent opponent in diagonal', () => {
    // Diagonal check
    // O at 0,0,0
    // X at 1,1,1
    // X at 2,2,2
    // X at 3,3,3
    const board = setupBoard([
      {x:0, y:0, z:0, p: 'O'},
      {x:1, y:1, z:1, p: 'X'},
      {x:2, y:2, z:2, p: 'X'},
      {x:3, y:3, z:3, p: 'X'}
    ]);

    const lastMove = {x:3, y:3, z:3};
    const exploded = checkExplosion(board, lastMove);
    
    expect(exploded.length).toBe(4);
    expect(exploded).toContainEqual({x:0, y:0, z:0});
  });
});



