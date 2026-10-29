import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import './App.css';
import { BoardState, Player, Coordinate, GameMode } from './types';
import { createEmptyBoard, checkWinner, isBoardFull, isValidMove, checkExplosion } from './utils/gameLogic';
import { getBestMove } from './utils/ai';
import { Board3D } from './components/Board3D';
import { StartScreen } from './components/StartScreen';
import { WinnerScreen } from './components/WinnerScreen';

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [board, setBoard] = useState<BoardState>(createEmptyBoard(4));
  const [boardSize, setBoardSize] = useState(4);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [isAiMode, setIsAiMode] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('Standard');
  const [explodingCells, setExplodingCells] = useState<Coordinate[]>([]);
  const [showEmptyCells, setShowEmptyCells] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      
      if (e.key === 'g') {
        setShowEmptyCells(prev => !prev);
      } else if (e.key === 'Escape' || e.key === '0') {
        setActiveLayer(null);
      } else {
        const key = parseInt(e.key);
        if (!isNaN(key) && key >= 1 && key <= boardSize) {
          setActiveLayer(prev => prev === key - 1 ? null : key - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, boardSize]);

  const applyMove = useCallback((z: number, y: number, x: number) => {
    const newBoard = board.map(layer => layer.map(row => [...row]));
    newBoard[z][y][x] = currentPlayer;
    
    const win = checkWinner(newBoard);
    if (win) {
      setBoard(newBoard);
      setWinner(win);
      setGameState('GAME_OVER');
    } else {
      // Check for explosion (3 in a row) - skip in gravity mode
      if (gameMode === 'Gravity') {
        // No explosions in gravity mode
        setBoard(newBoard);
        if (isBoardFull(newBoard)) {
          setWinner('Draw');
          setGameState('GAME_OVER');
        } else {
          setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
        }
      } else {
        // Standard mode: check for explosions
        const initialExploded = checkExplosion(newBoard, { x, y, z });
        
        if (initialExploded.length > 0) {
          // Standard mode: simple explosion
          setBoard(newBoard);
          setExplodingCells(initialExploded);
          
          setTimeout(() => {
            setBoard(prevBoard => {
              const nextBoard = prevBoard.map(layer => layer.map(row => [...row]));
              initialExploded.forEach(c => {
                nextBoard[c.z][c.y][c.x] = null;
              });
              return nextBoard;
            });
            setExplodingCells([]);
            
            // Turn switching happens after explosion
            setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
          }, 800);
        } else {
          // No explosion, immediate update
          setBoard(newBoard);
          if (isBoardFull(newBoard)) {
            setWinner('Draw');
            setGameState('GAME_OVER');
          } else {
            setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
          }
        }
      }
    }
  }, [board, currentPlayer, gameMode]);

  const handleCellClick = useCallback((z: number, y: number, x: number) => {
    if (gameState !== 'PLAYING') return;
    if (board[z][y][x] !== null || winner || isThinking || explodingCells.length > 0) return;
    
    if (!isValidMove(board, { x, y, z }, gameMode)) {
      console.log("Invalid move in " + gameMode + " mode");
      return;
    }

    applyMove(z, y, x);
  }, [board, winner, isThinking, explodingCells.length, applyMove, gameMode, gameState]);

  // AI Turn Effect
  useEffect(() => {
    if (gameState === 'PLAYING' && isAiMode && currentPlayer === 'O' && !winner && explodingCells.length === 0) {
      
      setIsThinking(true);
      
      const timer = setTimeout(() => {
        setTimeout(() => {
          try {
            const move = getBestMove(board, 'O', gameMode, 2);
            if (move) {
              applyMove(move.z, move.y, move.x);
            }
          } catch (error) {
            console.error("AI Error:", error);
          } finally {
            setIsThinking(false);
          }
        }, 10);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, isAiMode, winner, board, applyMove, gameMode, explodingCells.length, gameState]);

  const handleStartGame = (ai: boolean, mode: GameMode, size: number) => {
    setIsAiMode(ai);
    setGameMode(mode);
    setBoardSize(size);
    
    setBoard(createEmptyBoard(size));
    setCurrentPlayer('X');
    setWinner(null);
    setIsThinking(false);
    setExplodingCells([]);
    setGameState('PLAYING');
  };

  const resetGame = () => {
    setBoard(createEmptyBoard(boardSize));
    setCurrentPlayer('X');
    setWinner(null);
    setIsThinking(false);
    setExplodingCells([]);
    setGameState('PLAYING');
  };

  const returnToMenu = () => {
    setBoard(createEmptyBoard(4)); // Default for menu background
    setBoardSize(4);
    setCurrentPlayer('X');
    setWinner(null);
    setIsThinking(false);
    setExplodingCells([]);
    setGameState('MENU');
  };

  return (
    <div className="app-container">
      {gameState === 'MENU' && (
        <StartScreen onStart={handleStartGame} />
      )}

      {gameState === 'GAME_OVER' && winner && (
        <WinnerScreen 
          winner={winner} 
          onRestart={resetGame}
          onMenu={returnToMenu}
        />
      )}

      {gameState === 'PLAYING' && (
        <div className="game-hud">
          <div className="hud-top">
            <div className="player-turn">
              Turn: <span style={{ color: currentPlayer === 'X' ? '#ff6b6b' : '#4ecdc4' }}>{currentPlayer}</span>
              {isThinking && <span className="thinking-indicator">Thinking...</span>}
            </div>
            <div className="game-status">
              <span>{gameMode} Mode ({boardSize}x{boardSize})</span>
              <button className="menu-btn" onClick={returnToMenu}>MENU</button>
            </div>
          </div>
          
          <div className="instructions">
            <p className="desktop-instructions">Rotate: Left Click + Drag | Zoom: Scroll</p>
            <p className="desktop-instructions">Layers: 1-{boardSize} | Grid: G | Reset: Esc</p>
            <p className="mobile-instructions">Rotate: Drag | Zoom: Pinch</p>
            {gameMode === 'Gravity' && <p style={{color: '#ffd700'}}>Gravity Mode: Build from bottom up!</p>}
          </div>

          {boardSize > 0 && (
            <div className="layer-selector-mobile">
              <div className="layer-buttons">
                {Array.from({ length: boardSize }, (_, i) => (
                  <button
                    key={i}
                    className={`layer-btn ${activeLayer === i ? 'active' : ''}`}
                    onClick={() => setActiveLayer(prev => prev === i ? null : i)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className={`layer-btn ${activeLayer === null ? 'active' : ''}`}
                  onClick={() => setActiveLayer(null)}
                >
                  All
                </button>
              </div>
            </div>
          )}

          <div className="github-link-hud">
            <a 
              href="https://github.com/Gustu/3d-tic-tac-toe" 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-link-text"
            >
              GitHub
            </a>
          </div>
        </div>
      )}

      <div className="canvas-container">
        <Canvas camera={{ position: [6, 6, 9], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Environment preset="city" />
          
          <Board3D 
            board={board} 
            onCellClick={handleCellClick} 
            canPlay={gameState === 'PLAYING' && !isThinking && !(isAiMode && currentPlayer === 'O') && explodingCells.length === 0}
            activeLayer={activeLayer}
            explodingCells={explodingCells}
            showEmptyCells={showEmptyCells}
            isExploded={activeLayer !== null}
          />
          
          <OrbitControls 
            enablePan={false} 
            minDistance={3} 
            maxDistance={15}
            enableZoom={true}
            enableRotate={true}
          />
        </Canvas>
      </div>
    </div>
  );
}

export default App;
