# Yoga Flow Planner

A React-based yoga flow planning application built with tldraw for creating and organizing yoga sequences.

## Features

- **Interactive Canvas**: Create yoga flows using tldraw's powerful drawing tools
- **Yoga Pose Library**: Browse and add yoga poses with English and Sanskrit names
- **Custom Yoga Pose Tool**: Specialized tool for placing yoga poses on the canvas
- **Category Organization**: Organize poses by categories and subcategories
- **Theme Support**: Light and dark mode support
- **Responsive Design**: Works on desktop and tablet devices

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
