# Yoga Flow Planner

A collaborative yoga flow planning app built with React, TypeScript, and tldraw.

## Features

- Real-time collaborative canvas editing
- Cloud sync with Cloudflare Workers
- Custom yoga pose shapes and tools
- Multi-canvas management
- User authentication with Supabase

---

## 🚀 Local Development: Start & Debug Guide

### Quick Start

1. **Install dependencies (root):**
   ```sh
   npm install
   ```
2. **Install dependencies for Cloudflare Worker:**
   ```sh
   cd tldraw-sync-cloudflare && npm install && cd ..
   ```
3. **Start the Cloudflare Worker (in a separate terminal):**
   ```sh
   cd tldraw-sync-cloudflare && npm run dev
   ```
   - This runs both the worker and a test client. The worker will listen on port `8787`.
4. **Start the main app (in another terminal):**
   ```sh
   npm run dev
   ```
   - The app will run on port `5173` (or `5174` if 5173 is busy).
5. **Open the app:**
   - Visit the URL shown in the terminal (e.g. [http://localhost:5173](http://localhost:5173) or [http://localhost:5174](http://localhost:5174)).

### Debugging Tips

- **Cloudflare Worker not running?**
  - Make sure you see `Ready on http://127.0.0.1:8787` in the worker terminal.
  - If you get `curl: (7) Failed to connect`, the worker is not running or is on a different port.
- **WebSocket errors in browser?**
  - Ensure the worker is running and listening on port `8787`.
  - The app should connect to `ws://localhost:8787/connect/...`.
  - If you see a port like `5172`, update `tldraw-sync-cloudflare/vite.config.ts` to use `8787`.
- **Port already in use?**
  - The app will try the next available port (e.g. `5174`).
  - Always check the terminal output for the correct URL.
- **Worker logs:**
  - The worker terminal will show connection attempts, errors, and room activity.
  - Look for `[wrangler:info] GET /connect/... 101 Switching Protocols` for successful WebSocket connections.
- **Restarting:**
  - If you change config or see errors, stop both servers and restart them as above.

---

## Development

```bash
npm install
npm run dev
```

## Production

The app is automatically deployed to Vercel on push to main branch.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **tldraw** for the interactive canvas
- **Tailwind CSS** for styling
- **Custom SVG Shape Utilities** for yoga pose rendering

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd yoga-flow-planner-react
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

## Usage

1. **Select the Yoga Pose Tool**: Click the yoga pose icon in the toolbar
2. **Choose a Category**: Select from the available yoga pose categories
3. **Browse Poses**: View poses in the floating panel above the toolbar
4. **Add Poses**: Click on any pose to add it to your canvas
5. **Organize Your Flow**: Arrange poses to create your yoga sequence
6. **Use Other Tools**: Switch to select, text, or drawing tools as needed

## Project Structure

```
src/
├── components/          # React components
│   ├── FlowPlanner.tsx # Main application component
│   └── YogaPosePanel.tsx # Yoga pose selection panel
├── shapes/             # Custom tldraw shape utilities
│   ├── yoga-pose-shape.ts
│   └── yoga-pose-svg-shape.ts
├── assets/             # Static assets and data
│   ├── yoga-flows.ts   # Category and pose data
│   └── sample-svg-poses.ts
├── utils/              # Utility functions
│   └── svg-pose-parser.ts
└── types/              # TypeScript type definitions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Poses

1. Add pose data to `src/assets/sample-svg-poses.ts`
2. Include SVG content and metadata
3. The pose will automatically appear in the appropriate category

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).

This means:
- ✅ **You can use, modify, and distribute this code**
- ✅ **You must give credit to the original author**
- ❌ **You cannot use this code for commercial purposes**
- ✅ **Any derivatives must use the same license**

For commercial use, please contact the author for licensing terms.

[View full license text](https://creativecommons.org/licenses/by-nc-sa/4.0/)
