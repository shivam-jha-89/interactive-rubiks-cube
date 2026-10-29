import { useRef } from 'react';
import { Group } from 'three';
import { BoardState, Coordinate } from '../types';
import { Cell } from './Cell';

interface Board3DProps {
  board: BoardState;
  onCellClick: (z: number, y: number, x: number) => void;
  canPlay: boolean; // True if it's a human player's turn and game is not over
  activeLayer: number | null;
  explodingCells?: Coordinate[];
  showEmptyCells?: boolean;
  isExploded?: boolean;
}

export function Board3D({ board, onCellClick, canPlay, activeLayer, explodingCells = [], showEmptyCells = true, isExploded = false }: Board3DProps) {
  const groupRef = useRef<Group>(null);
  const spacing = 1.1;
  const explodedSpacing = 2.5;
  const size = board.length;

  const cells = [];
  
  // Loop order: Layer (z), Row (y), Col (x)
  for (let z = 0; z < size; z++) {
    const isLayerActive = activeLayer === null || activeLayer === z;
    const showLayerEdges = activeLayer !== null && activeLayer === z;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cellValue = board[z][y][x];
        
        // Map indices to centered 3D coordinates
        // Logic X -> 3D X
        // Logic Y (Row) -> 3D Z (Depth)
        // Logic Z (Layer) -> 3D Y (Height)
        const currentSpacing = isExploded ? explodedSpacing : spacing;
        
        // Keep x and z tightly packed, only explode vertically (y in 3D)
        const xPos = (x - (size - 1) / 2) * spacing;
        // For vertical (layer) position, use the exploded spacing if active
        const yPos = (z - (size - 1) / 2) * currentSpacing;
        const zPos = (y - (size - 1) / 2) * spacing;

        // Cell is disabled if:
        // 1. It has a value (occupied)
        // 2. It's not the player's turn (canPlay is false)
        // 3. The layer is not active
        const isCellDisabled = !!cellValue || !canPlay || !isLayerActive;
        const isDimmed = !isLayerActive;
        const isClickable = isLayerActive && !cellValue && canPlay;

        // Check if this cell is exploding
        const isExploding = explodingCells.some(c => c.x === x && c.y === y && c.z === z);

        cells.push(
          <Cell
            key={`${z}-${y}-${x}`}
            position={[xPos, yPos, zPos]}
            value={cellValue}
            onClick={() => onCellClick(z, y, x)}
            disabled={isCellDisabled}
            dimmed={isDimmed}
            isExploding={isExploding}
            showEmpty={showEmptyCells}
            showLayerEdges={showLayerEdges}
            isClickable={isClickable}
          />
        );
      }
    }
  }

  return (
    <group ref={groupRef}>
      {cells}
    </group>
  );
}
