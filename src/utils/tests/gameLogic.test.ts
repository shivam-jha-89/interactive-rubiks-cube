import { describe, it, expect } from 'vitest';
import { createEmptyBoard, checkWinner, isBoardFull, getEmptyCells } from '../gameLogic';
import { BoardState, Player } from '../../types';

const BOARD_SIZE = 4;

describe('Game Logic', () => {
  it('should create an empty board', () => {
    const board = createEmptyBoard();
    expect(board.length).toBe(BOARD_SIZE);
    expect(board[0].length).toBe(BOARD_SIZE);
    expect(board[0][0].length).toBe(BOARD_SIZE);
    expect(board[0][0][0]).toBeNull();
    expect(getEmptyCells(board).length).toBe(BOARD_SIZE * BOARD_SIZE * BOARD_SIZE);
  });

  describe('Winning Conditions', () => {
    const setupBoardWithWin = (coords: {x: number, y: number, z: number}[], player: Player): BoardState => {
      const board = createEmptyBoard();
      coords.forEach(c => {
        board[c.z][c.y][c.x] = player;
      });
      return board;
    };

    it('should detect a row win (same z, same y, varying x)', () => {
      // Layer 0, Row 0
      const coords = [];
      for(let i=0; i<BOARD_SIZE; i++) coords.push({x:i, y:0, z:0});
      const board = setupBoardWithWin(coords, 'X');
      expect(checkWinner(board)).toBe('X');
    });

    it('should detect a column win (same z, same x, varying y)', () => {
      // Layer 0, Col 0
      const coords = [];
      for(let i=0; i<BOARD_SIZE; i++) coords.push({x:0, y:i, z:0});
      const board = setupBoardWithWin(coords, 'O');
      expect(checkWinner(board)).toBe('O');
    });

    it('should detect a pillar win (same x, same y, varying z)', () => {
      // Pillar at 0,0
      const coords = [];
      for(let i=0; i<BOARD_SIZE; i++) coords.push({x:0, y:0, z:i});
      const board = setupBoardWithWin(coords, 'X');
      expect(checkWinner(board)).toBe('X');
    });

    it('should detect a face diagonal win (same z)', () => {
      // Layer 0 diagonal
      const coords = [];
      for(let i=0; i<BOARD_SIZE; i++) coords.push({x:i, y:i, z:0});
      const board = setupBoardWithWin(coords, 'O');
      expect(checkWinner(board)).toBe('O');
    });

    it('should detect a space diagonal win (corner to opposite corner)', () => {
      // 0,0,0 -> 3,3,3
      const coords = [];
      for(let i=0; i<BOARD_SIZE; i++) coords.push({x:i, y:i, z:i});
      const board = setupBoardWithWin(coords, 'X');
      expect(checkWinner(board)).toBe('X');
    });

    it('should detect space diagonal win (0,0,3 -> 3,3,0)', () => {
        const coords = [];
        for(let i=0; i<BOARD_SIZE; i++) coords.push({x:i, y:i, z:BOARD_SIZE-1-i});
        const board = setupBoardWithWin(coords, 'O');
        expect(checkWinner(board)).toBe('O');
    });

    it('should return null if no winner', () => {
      const board = createEmptyBoard();
      board[0][0][0] = 'X';
      board[0][0][1] = 'O';
      expect(checkWinner(board)).toBeNull();
    });
  });

  describe('Board State', () => {
    it('should correctly identify a full board', () => {
      const board = createEmptyBoard();
      // Fill board
      for(let z=0; z<BOARD_SIZE; z++) {
        for(let y=0; y<BOARD_SIZE; y++) {
          for(let x=0; x<BOARD_SIZE; x++) {
            board[z][y][x] = 'X';
          }
        }
      }
      expect(isBoardFull(board)).toBe(true);
    });

    it('should correctly identify a non-full board', () => {
      const board = createEmptyBoard();
      expect(isBoardFull(board)).toBe(false);
      board[0][0][0] = 'X';
      expect(isBoardFull(board)).toBe(false);
    });
  });
});
