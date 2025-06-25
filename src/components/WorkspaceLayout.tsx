import React from 'react';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  canvases: Array<{
    metadata: {
      id: string;
      title: string;
      lastModified: Date;
    };
  }>;
  currentCanvas: {
    metadata: {
      id: string;
      title: string;
      lastModified: Date;
    };
  } | null;
  onCanvasSwitch: (canvasId: string) => void;
  onCreateCanvas: () => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ 
  children, 
  canvases, 
  currentCanvas, 
  onCanvasSwitch,
  onCreateCanvas
}) => {

  // Sort canvases alphabetically by title
  const sortedCanvases = [...canvases].sort((a, b) => 
    a.metadata.title.localeCompare(b.metadata.title)
  );

  return (
    <div 
      className="workspace-layout"
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        padding: '40px 40px 40px 8px',
        backgroundColor: 'var(--color-panel)',
        gap: '8px',
        boxSizing: 'border-box'
      }}
    >
      {/* Canvas Title Menu - Left Side */}
      <div 
        className="canvas-menu"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          minWidth: '200px',
          maxWidth: '200px',
          padding: '0',
          backgroundColor: 'transparent',
          border: 'none',
          gap: '4px'
        }}
      >
        {sortedCanvases.map((canvas) => (
          <button
            key={canvas.metadata.id}
            onClick={async () => {
              try {
                await onCanvasSwitch(canvas.metadata.id);
              } catch (err) {
                console.error('Failed to switch canvas:', err);
              }
            }}
            className="tlui-button tlui-button__menu"
            style={{
              width: '100%',
              maxWidth: '200px',
              padding: '8px 12px',
              backgroundColor: currentCanvas?.metadata.id === canvas.metadata.id 
                ? 'var(--color-selected)' 
                : 'transparent',
              color: 'var(--color-text)',
              border: '1px solid var(--color-panel-contrast)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.1s ease',
              fontSize: '14px',
              fontWeight: currentCanvas?.metadata.id === canvas.metadata.id ? '600' : '400',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              fontFamily: 'inherit'
            }}
            data-state={currentCanvas?.metadata.id === canvas.metadata.id ? 'selected' : 'idle'}
            title={canvas.metadata.title}
          >
            {canvas.metadata.title}
          </button>
        ))}
        
        {/* Create New Canvas Button */}
        <button
          onClick={onCreateCanvas}
          className="tlui-button tlui-button__menu"
          style={{
            width: '100%',
            maxWidth: '200px',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            color: 'var(--color-text)',
            border: '1px solid var(--color-panel-contrast)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.1s ease',
            fontSize: '14px',
            fontWeight: '400',
            textAlign: 'left',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            fontFamily: 'inherit',
            marginTop: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(0 0% 96.1%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Create New Canvas"
        >
          + Create New Canvas
        </button>
      </div>

      {/* Canvas Area - Right Side */}
      <div 
        className="canvas-area"
        style={{
          flex: 1,
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  );
}; 