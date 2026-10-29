import { Player } from '../types';

interface WinnerScreenProps {
  winner: Player | 'Draw';
  onRestart: () => void;
  onMenu: () => void;
}

export function WinnerScreen({ winner, onRestart, onMenu }: WinnerScreenProps) {
  return (
    <div className="screen winner-screen">
      <div className="neon-box">
        <h2 className="winner-title">
          {winner === 'Draw' ? (
            <span className="draw-text">DRAW GAME</span>
          ) : (
            <>
              <span className={`player-${winner}`}>PLAYER {winner}</span><br/>WINS!
            </>
          )}
        </h2>
        
        <div className="action-buttons">
          <button className="primary-btn" onClick={onRestart}>
            PLAY AGAIN
          </button>
          <button className="secondary-btn" onClick={onMenu}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
