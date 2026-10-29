# 3D Tic-Tac-Toe

A modern, interactive 3D tic-tac-toe game built with React, TypeScript, and Three.js. Play in a stunning 3D environment with AI opponents, multiple game modes, and customizable board sizes.

![3D Tic-Tac-Toe](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue) ![Three.js](https://img.shields.io/badge/Three.js-0.181.2-black)

## 🎮 Features

- **3D Visualization**: Immersive 3D board rendered with React Three Fiber
- **Two Game Modes**:
  - **Standard Mode**: Place pieces anywhere on the board
  - **Gravity Mode**: Pieces fall to the bottom (Connect 4 style)
- **AI Opponent**: Intelligent AI using minimax algorithm with alpha-beta pruning
- **Multiple Board Sizes**: Play on 3x3, 4x4, or 5x5 boards
- **Explosion Mechanics**: Get 3 in a row to explode pieces and clear the board
- **Interactive Controls**: Rotate, zoom, and navigate the 3D board with ease
- **Player vs Player**: Challenge a friend in local multiplayer mode

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Gustu/3d-tic-tac-toe.git
cd 3d-tic-tac-toe
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🎯 How to Play

### Objective
Get N pieces in a row (where N is the board size) to win the game!

### Game Modes

**Standard Mode**:
- Place pieces anywhere on the board
- Get 3 in a row to explode those pieces
- First to get N in a row wins

**Gravity Mode**:
- Pieces automatically fall to the bottom of each column
- Similar to Connect 4 mechanics
- Get 3 in a row to explode pieces
- First to get N in a row wins

### Controls

- **Rotate**: Left Click + Drag
- **Zoom**: Mouse Scroll Wheel
- **Layer Selection**: Press `1` through `N` (where N is board size)
- **Toggle Grid**: Press `G`
- **Reset Layer View**: Press `Esc` or `0`

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run preview` - Preview production build

### Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Three Fiber** - 3D rendering
- **Three.js** - 3D graphics library
- **@react-three/drei** - Useful helpers for R3F
- **Vitest** - Testing framework

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Board3D.tsx     # 3D board rendering
│   ├── Cell.tsx        # Individual cell component
│   ├── StartScreen.tsx # Main menu
│   ├── WinnerScreen.tsx # Game over screen
│   └── PlayerMaterials.tsx # Material definitions
├── utils/              # Game logic and utilities
│   ├── gameLogic.ts    # Core game rules
│   ├── ai.ts          # AI opponent logic
│   └── tests/         # Test files
├── types.ts           # TypeScript type definitions
└── App.tsx            # Main application component
```

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Links

- [GitHub Repository](https://github.com/shivam-jha-89/interactive-rubiks-cube)
- [Report Issues](https://interactive-rubiks-cube-pearl.vercel.app/)

---

Made with ❤️ using React Three Fiber

