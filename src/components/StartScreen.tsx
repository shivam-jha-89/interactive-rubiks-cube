import React from 'react';
import { GameMode } from '../types';

interface StartScreenProps {
  onStart: (aiMode: boolean, mode: GameMode, boardSize: number) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [isAiMode, setIsAiMode] = React.useState(true);
  const [gameMode, setGameMode] = React.useState<GameMode>('Standard');
  const [boardSize, setBoardSize] = React.useState(4);

  return (
    <div className="screen start-screen">
      <div className="neon-box">
        <h1 className="game-title">3D TIC-TAC-TOE</h1>
        
        <div className="menu-options">
          <div className="option-row">
            <div className="option-group">
              <label>OPPONENT</label>
              <div className="toggle-group">
                <button 
                  className={isAiMode ? 'active' : ''} 
                  onClick={() => setIsAiMode(true)}
                >
                  AI
                </button>
                <button 
                  className={!isAiMode ? 'active' : ''} 
                  onClick={() => setIsAiMode(false)}
                >
                  PVP
                </button>
              </div>
            </div>

            <div className="option-group">
              <label>MODE</label>
              <div className="toggle-group">
                <button 
                  className={gameMode === 'Standard' ? 'active' : ''} 
                  onClick={() => setGameMode('Standard')}
                >
                  STD
                </button>
                <button 
                  className={gameMode === 'Gravity' ? 'active' : ''} 
                  onClick={() => setGameMode('Gravity')}
                >
                  GRAV
                </button>
              </div>
            </div>
          </div>

          <div className="option-row">
            <div className="option-group">
              <label>SIZE</label>
              <div className="toggle-group">
                <button 
                  className={boardSize === 3 ? 'active' : ''} 
                  onClick={() => setBoardSize(3)}
                >
                  3x3
                </button>
                <button 
                  className={boardSize === 4 ? 'active' : ''} 
                  onClick={() => setBoardSize(4)}
                >
                  4x4
                </button>
                <button 
                  className={boardSize === 5 ? 'active' : ''} 
                  onClick={() => setBoardSize(5)}
                >
                  5x5
                </button>
              </div>
            </div>
          </div>

          <div className="rules-box">
            <h3>HOW TO PLAY</h3>
            <p>
              {gameMode === 'Standard' 
                ? `• ${boardSize}x${boardSize}x${boardSize} Grid\n• Place pieces anywhere\n• 3 in a row EXPLODES!\n• Get ${boardSize} in a row TO WIN` 
                : `• Gravity Enabled (Connect ${boardSize} style)\n• Pieces fall to bottom\n• 3 in a row EXPLODES!\n• Get ${boardSize} in a row TO WIN`}
            </p>
            <p className="controls-hint desktop-controls-hint">
              Rotate: Drag • Zoom: Scroll • Layers: 1-{boardSize}
            </p>
            <p className="controls-hint mobile-controls-hint">
              Rotate: Drag • Zoom: Pinch • Layers: Use buttons
            </p>
          </div>

          <button className="primary-btn start-btn" onClick={() => onStart(isAiMode, gameMode, boardSize)}>
            PLAY
          </button>

          <div className="github-link">
            <a 
              href="https://github.com/Gustu/3d-tic-tac-toe" 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-link-text"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
