import React, { createContext, useContext } from 'react';

// Canvas context to share state between components
export interface CanvasContextType {
  canvases: Array<{
    id: string;
    title: string;
    folderId?: string | null;
    createdAt?: Date;
    sort_order?: number;
  }>;
  currentCanvasId: string;
  setCurrentCanvasId: React.Dispatch<React.SetStateAction<string>>;
}

export const CanvasContext = createContext<CanvasContextType | null>(null);

// Hook to use canvas context
export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
}

// Provider component
export interface CanvasProviderProps {
  children: React.ReactNode;
  value: CanvasContextType;
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children, value }) => {
  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}; 