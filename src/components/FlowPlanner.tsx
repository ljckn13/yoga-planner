import React, { useLayoutEffect, useRef, createContext, useContext } from 'react';
import {
  Tldraw,
  TldrawUiMenuItem,
  TldrawUiMenuGroup,
  useIsToolSelected,
  useTools,
  type TLComponents,
  type TLUiAssetUrlOverrides,
  type TLUiOverrides,
  useEditor,
  useValue,
  useIsDarkMode,
  DefaultMainMenu,
  DefaultMainMenuContent,
  DefaultToolbar,
  DefaultToolbarContent,
  type Editor,
} from 'tldraw';
import 'tldraw/tldraw.css';
import { YogaPoseShapeUtil, YogaPoseTool, YogaPoseSvgShapeUtil } from '../shapes';
import { YogaPosePanel } from './YogaPosePanel';
import { EditableCanvasTitle } from './EditableCanvasTitle';
import { getPoseState } from '../utils/pose-state';
import { yogaCategories } from '../assets/yoga-flows';
import { useCloudSync } from '../hooks/useCloudSync';
import { useAuthContext } from './AuthProvider';
import { ArrowUpLeft, ArrowDownRight, Plus, X, MoreVertical } from 'lucide-react';

// Temporary debug function to clear localStorage
const clearLocalStorage = () => {
  console.log('🧹 Clearing localStorage...');
  localStorage.clear();
  console.log('✅ localStorage cleared');
  window.location.reload();
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).clearLocalStorage = clearLocalStorage;
}

// Canvas context to share state between components
interface CanvasContextType {
  canvases: Array<{id: string, title: string}>;
  currentCanvasId: string;
  setCanvases: React.Dispatch<React.SetStateAction<Array<{id: string, title: string}>>>;
  setCurrentCanvasId: React.Dispatch<React.SetStateAction<string>>;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

// Hook to use canvas context
function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
}

// Custom grid component with subtle dots
const CustomGrid = ({ size, ...camera }: any) => {
  const editor = useEditor()
  const screenBounds = useValue('screenBounds', () => editor.getViewportScreenBounds(), [])
  const devicePixelRatio = useValue('dpr', () => editor.getInstanceState().devicePixelRatio, [])
  const isDarkMode = useIsDarkMode()
  const canvas = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    if (!canvas.current) return
    const canvasW = screenBounds.w * devicePixelRatio
    const canvasH = screenBounds.h * devicePixelRatio
    canvas.current.width = canvasW
    canvas.current.height = canvasH

    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasW, canvasH)

    // Use a larger grid size for more distance between dots
    const gridSize = size * 2

    const pageViewportBounds = editor.getViewportPageBounds()
    const startPageX = Math.ceil(pageViewportBounds.minX / gridSize) * gridSize
    const startPageY = Math.ceil(pageViewportBounds.minY / gridSize) * gridSize
    const endPageX = Math.floor(pageViewportBounds.maxX / gridSize) * gridSize
    const endPageY = Math.floor(pageViewportBounds.maxY / gridSize) * gridSize
    const numRows = Math.round((endPageY - startPageY) / gridSize)
    const numCols = Math.round((endPageX - startPageX) / gridSize)

    // Dots color that matches the yellow-white background theme
    ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 69, 19, 0.15)'

    // Draw dots at grid intersections
    for (let row = 0; row <= numRows; row++) {
      for (let col = 0; col <= numCols; col++) {
        const pageX = startPageX + col * gridSize
        const pageY = startPageY + row * gridSize
        const canvasX = (pageX + camera.x) * camera.z * devicePixelRatio
        const canvasY = (pageY + camera.y) * camera.z * devicePixelRatio
        
        // Draw a small dot
        ctx.beginPath()
        ctx.arc(canvasX, canvasY, 1 * devicePixelRatio, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }, [screenBounds, camera, size, devicePixelRatio, editor, isDarkMode])

  return <canvas className="tl-grid" ref={canvas} />
}

// Custom hook to track current canvas title
function useCurrentCanvasTitle(editor: Editor | null) {
  const [canvasTitle, setCanvasTitle] = React.useState('Untitled Canvas');
  const { currentCanvasId } = useCanvasContext();
  
  React.useEffect(() => {
    if (!editor) return;
    
    const updateCanvasTitle = () => {
      try {
        const canvasList = localStorage.getItem('yoga_flow_canvas_list');
        if (canvasList) {
          const canvases = JSON.parse(canvasList);
          // Find the current canvas by currentCanvasId
          const currentCanvas = canvases.find((canvas: any) => canvas.id === currentCanvasId);
          
          if (currentCanvas?.title) {
            setCanvasTitle(currentCanvas.title);
          } else {
            setCanvasTitle('Untitled Canvas');
          }
        }
      } catch (err) {
        console.error('Error updating canvas title:', err);
        setCanvasTitle('Untitled Canvas');
      }
    };
    
    // Update immediately
    updateCanvasTitle();
    
    // Set up an interval to check for changes
    const interval = setInterval(updateCanvasTitle, 50); // More frequent updates
    
    // Also listen for storage events to catch changes from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'yoga_flow_canvas_list') {
        updateCanvasTitle();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [editor, currentCanvasId]); // Add currentCanvasId to dependencies
  
  return canvasTitle;
}

// Custom page menu that shows canvas title and main menu side by side
function CustomPageMenu({ sidebarVisible }: { sidebarVisible: boolean }) {
  const editor = useEditor();
  const canvasTitle = useCurrentCanvasTitle(editor);
  return (
    <div className="tlui-page-menu">
      <div className="tlui-page-menu__header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Arrow Icon in Canvas UI Main Menu */}
        {sidebarVisible ? (
          <ArrowUpLeft size={18} />
        ) : (
          <ArrowDownRight size={18} />
        )}
        <div 
          className="tlui-page-menu__header__title tlui-text text-primary-bold w-30 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            width: '120px',
          }}
        >
          {canvasTitle}
        </div>
        {/* Main menu to the right of the title */}
        <CustomMainMenu />
      </div>
    </div>
  );
}

// Custom main menu with canvas management
function CustomMainMenu() {
  const { canvases, currentCanvasId, setCanvases, setCurrentCanvasId } = useCanvasContext();

  const handleDeleteCanvas = async () => {
    if (canvases.length <= 1) {
      alert('Cannot delete the last canvas. Create a new one first.');
      return;
    }
    
    const currentCanvas = canvases.find(c => c.id === currentCanvasId);
    if (!currentCanvas) return;
    
    if (confirm(`Are you sure you want to delete "${currentCanvas.title}"?`)) {
      console.log('Deleting canvas:', currentCanvas);
      const newCanvases = canvases.filter(c => c.id !== currentCanvasId);
      console.log('Updated canvases after delete:', newCanvases);
      setCanvases(newCanvases);
      setCurrentCanvasId(newCanvases[0].id);
    }
  };

  return (
    <DefaultMainMenu>
      <DefaultMainMenuContent />
      {canvases.length > 1 && (
        <TldrawUiMenuGroup id="canvas-management">
          <TldrawUiMenuItem
            id="delete-canvas"
            label="Delete Canvas"
            icon="trash"
            onSelect={handleDeleteCanvas}
          />
        </TldrawUiMenuGroup>
      )}
    </DefaultMainMenu>
  );
}

// Reusable Sidebar Button Component
interface SidebarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
  title?: string;
  borderRadius?: string;
  marginBottom?: string;
  boxShadow?: string;
  activeBoxShadow?: string;
  backgroundColor?: string;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ 
  onClick, 
  icon, 
  text, 
  title, 
  borderRadius = '8px',
  marginBottom = '8px',
  boxShadow = 'var(--shadow-neumorphic-complex)',
  activeBoxShadow = 'var(--shadow-neumorphic-inset)',
  backgroundColor = 'var(--bg-glass)'
}) => {
  const [isActive, setIsActive] = React.useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onMouseLeave={() => {
        // Keep white background when leaving
      }}
      className="btn-primary w-full mb-2"
      style={{
        borderRadius,
        marginBottom,
        backgroundColor,
        boxShadow: isActive ? activeBoxShadow : boxShadow,
      }}
      title={title}
    >
      <span className="flex-1 text-left">{text}</span>
      <span className="flex items-center">{icon}</span>
    </button>
  );
};

// [1] UI Overrides to add yoga pose tool to the context and remove unwanted tools
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Only keep the tools we want
    const allowedTools: any = {
      select: tools.select,
      text: tools.text,
      yogaPose: {
      id: 'yoga-pose-tool',
      icon: 'yoga-icon',
      label: 'Yoga Pose',
      kbd: 'y',
      onSelect: () => {
        editor.setCurrentTool('yoga-pose-tool')
      },
    }
    }
    
    // Add other tools only if they exist
    if (tools.frame) allowedTools.frame = tools.frame
    // if (tools.hand) allowedTools.hand = tools.hand
    if (tools.media) allowedTools.media = tools.media
    if (tools.asset) allowedTools.asset = tools.asset
    if (tools.draw) allowedTools.draw = tools.draw
    // if (tools.highlight) allowedTools.highlight = tools.highlight
    // if (tools.eraser) allowedTools.eraser = tools.eraser
    if (tools.note) allowedTools.note = tools.note
    
    return allowedTools
  },
  // Enable style panel for yoga pose tool
  actions(editor, actions) {
    return {
      ...actions,
      'toggle-quick-styles': {
        id: 'toggle-quick-styles',
        label: 'Toggle Quick Styles',
        kbd: '$mod+shift+s',
        onSelect: () => {
          editor.setCurrentTool('select')
        },
      },
    }
  },
}

// [2] Components to override toolbar and keyboard shortcuts  
const createComponents = (sidebarVisible: boolean): TLComponents => ({
  Grid: CustomGrid,
  MainMenu: null,
  PageMenu: () => <CustomPageMenu sidebarVisible={sidebarVisible} />,
  Toolbar: (props) => {
    const tools = useTools()
    const editor = useEditor()
    const isYogaPoseSelected = useIsToolSelected(tools['yogaPose'])
    const [activeCategory, setActiveCategory] = React.useState<number>(0) // Use number for Category enum
    const [isHoveringPoseTool] = React.useState(false)
    const { user: _user } = useAuthContext()
    
    return (
      <>
        {/* Floating YogaPosePanel above the toolbar */}
        {isYogaPoseSelected && (
          <div 
            className="tlui-panel"
            style={{
              position: 'fixed',
              bottom: '64px', // 8px (toolbar bottom) + 40px (toolbar height) + 8px (gap) + 8px (extra up)
              left: '50%',
              transform: 'translateX(-50%)',
              width: '440px', // Fixed width to match toolbar
              zIndex: 9999,
              maxHeight: '300px',
              pointerEvents: 'auto',
              borderRadius: '12px',
              boxShadow: '0px 0px 2px hsl(0, 0%, 0%, 16%), 0px 2px 3px hsl(0, 0%, 0%, 24%), 0px 2px 6px hsl(0, 0%, 0%, 0.1), inset 0px 0px 0px 1px hsl(0, 0%, 100%)'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
          <YogaPosePanel 
            onPoseSelect={(pose) => {
              getPoseState().setSelectedPose(pose);
            }}
            selectedPose={getPoseState().selectedPose}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
        )}

        <div style={{ 
          width: '440px',
          '--tlui-toolbar-width': '440px',
          position: 'fixed',
          bottom: '0px', // 4px gap from bottom (moved down by 4px)
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        } as React.CSSProperties}>
          <style>
            {`
              /* Force toolbar width to 440px */
              div[style*="width: 440px"] .tlui-toolbar {
                width: 440px !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools {
                width: 440px !important;
                max-width: 440px !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools > * {
                flex: 1 !important;
                width: 100% !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button {
                width: 100% !important;
                flex: 1 !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button[data-state="selected"]::after,
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button[aria-pressed="true"]::after,
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button.tlui-button__selected::after {
                background-color: hsl(0 0% 94%) !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button[data-state="selected"],
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button[aria-pressed="true"],
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button.tlui-button__selected {
                color: var(--color-text) !important;
              }
            `}
          </style>
          <DefaultToolbar {...props}>
            {/* Custom Yoga Pose Tool Button - Always visible */}
            <div style={{ padding: '0 4px' }}>
              <button
                onMouseEnter={() => {
                  // Keep white background on hover
                }}
                onMouseLeave={() => {
                  // Keep white background when leaving
                }}
                onClick={() => {
                  if (isYogaPoseSelected) {
                    // Deactivate yoga pose tool and switch to select
                    editor.setCurrentTool('select')
                  } else {
                    // Activate yoga pose tool
                    editor.setCurrentTool('yoga-pose-tool')
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  backgroundColor: isYogaPoseSelected 
                    ? (isHoveringPoseTool ? '#EEF0F2' : 'hsl(0 0% 94%)') 
                    : (isHoveringPoseTool ? '#EEF0F2' : 'transparent'),
                  color: 'var(--color-text)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  position: 'relative'
                }}
                title={isYogaPoseSelected ? 'Exit Yoga Pose Tool' : 'Yoga Pose Tool'}
              >
                {isYogaPoseSelected && isHoveringPoseTool ? (
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 400 400" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="23.7138" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M53.3214 378.29C48.7952 378.376 25.8009 387.388 22.9267 381.718C11.7629 359.699 52.2853 324.225 63.1906 314.427C131.032 253.479 206.364 210.474 293.345 230.136C309.62 233.814 327.128 241.669 332.663 262.742C339.019 286.938 345.673 318.52 345.673 344.127C345.673 365.685 342.055 365.403 355.522 356.745C362.318 352.376 379.465 344.851 386.119 353.531C387.921 355.882 389.14 363.509 386.361 365.336M225.448 136.499C221.027 120.076 225.196 170.556 225.903 187.563C226.163 193.806 229.062 225.803 216.615 225.803M197.983 52.5269C175.092 45.1433 189.055 115.596 219.618 119.631C280.084 127.612 235.811 23.6007 197.983 49.1472M108.083 30.9972C97.8879 59.1956 127.586 98.8249 141.33 121.691C151.127 137.99 198.523 176.926 217.999 182.983M289.465 12.4131C302.589 5.51314 299.323 87.2355 298.894 93.8838C297.479 115.796 291.371 140.149 279.132 158.546C273.706 166.703 235.013 184.237 230.484 192.693"/>
                  </svg>
                )}
              </button>
            </div>
            
            {isYogaPoseSelected ? (
              // Show categories when yoga pose tool is selected
              <div style={{ 
                display: 'flex', 
                gap: '0px', 
                padding: '4px 4px', 
                alignItems: 'center',
                flex: 1,
                minHeight: '40px'
              }}>
                {yogaCategories.map((category) => (
                  <button
                    key={category.category}
                    onClick={() => setActiveCategory(category.category)}
                    style={{ 
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                      padding: '6px 12px',
                      backgroundColor: activeCategory === category.category ? '#EEF0F2' : 'transparent',
                      color: 'var(--color-text)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      height: '40px',
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      flex: 1,
                      margin: '0 2px'
                    }}
                    onMouseEnter={(e) => {
                      if (activeCategory !== category.category) {
                        e.currentTarget.style.backgroundColor = '#EEF0F2';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeCategory !== category.category) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            ) : (
              // Show normal tools when yoga pose tool is not selected
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                flex: 1,
                minHeight: '40px',
                padding: '0 4px'
              }}>
                <DefaultToolbarContent />
              </div>
            )}
          </DefaultToolbar>
        </div>
      </>
    )
  },
})

// [3] Custom asset URLs for our yoga icon
export const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    'yoga-icon': '/yoga-pose-icon.svg',
  },
}

// [4] Custom tools and shapes
const customTools = [YogaPoseTool]
const customShapeUtils = [YogaPoseShapeUtil, YogaPoseSvgShapeUtil]

// Floating Export Button Component that uses editor reference
function FloatingExportButton({ editor }: { editor: Editor | null }) {
  const [exportFormat, setExportFormat] = React.useState<'png' | 'svg'>('png');

  const handleExport = async () => {
    if (!editor) {
      alert('Editor not ready. Please try again.');
      return;
    }

    console.log('Editor instance:', editor);
    console.log('Current page:', editor.getCurrentPageId());
    
    // Try different methods to get shapes
    const currentPageShapes = editor.getCurrentPageShapeIds();
    const selectedShapes = editor.getSelectedShapeIds();
    
    console.log('Current page shapes:', currentPageShapes);
    console.log('Selected shapes:', selectedShapes);
    
    // Use current page shapes or selected shapes
    let ids = [...currentPageShapes];
    if (!ids.length) {
      ids = [...selectedShapes];
      console.log('Using selected shapes instead:', ids);
    }
    
    if (!ids.length) {
      alert('Nothing to export! No shapes found on canvas.');
      return;
    }

    try {
      const { blob } = await editor.toImage(ids, {
        format: exportFormat,
        background: false, // transparent background
        scale: exportFormat === 'png' ? 2 : 1, // higher quality for PNG, normal for SVG
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get canvas title for filename
      const canvasList = localStorage.getItem('yoga_flow_canvas_list');
      let filename = `yoga-flow.${exportFormat}`;
      if (canvasList) {
        try {
          const canvases = JSON.parse(canvasList);
          const currentCanvasId = localStorage.getItem('yoga_flow_current_canvas_id');
          const currentCanvas = canvases.find((canvas: any) => canvas.id === currentCanvasId);
          if (currentCanvas?.title) {
            filename = `${currentCanvas.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${exportFormat}`;
          }
        } catch (err) {
          console.error('Error getting canvas title for filename:', err);
        }
      }
      
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const toggleFormat = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the main export
    setExportFormat(exportFormat === 'png' ? 'svg' : 'png');
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Main Export Button with Integrated Toggle */}
      <button
        onClick={handleExport}
        style={{
          position: 'fixed',
          top: '40px',
          left: '50%',
          height: '40px',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '8px 12px',
          borderRadius: '0 0 8px 8px',
          background: '##EFF1F3',
          color: '#000000',
          fontSize: '12px',
          fontWeight: '500',
          fontFamily: 'var(--font-system)',
          border: '1px solid var(--color-divider)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.1s ease',
          minWidth: '140px',
          marginBottom: '0px',
        }}
        title={`Export as ${exportFormat.toUpperCase()}`}
      >
        <span>Export</span>
        
        {/* Toggle Switch */}
        <div
          onClick={toggleFormat}
          style={{
            position: 'relative',
            width: '74px',
            height: '28px',
            background: '#e5e6e6',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
            boxSizing: 'border-box',
          }}
          title={`Switch to ${exportFormat === 'png' ? 'SVG' : 'PNG'}`}
        >
          {/* Toggle Slider */}
          <div
            style={{
              width: '34px',
              height: '24px',
              background: '#fff',
              borderRadius: '6px',
              transform: exportFormat === 'svg' ? 'translateX(36px)' : 'translateX(0px)',
              transition: 'transform 0.3s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          />
          
          {/* Format Labels */}
          <div
            style={{
              position: 'absolute',
              left: '8px',
              fontSize: '8px',
              fontWeight: '700',
              color: exportFormat === 'png' ? '#000000' : 'rgb(102, 102, 102)',
              transition: 'color 0.3s ease',
              pointerEvents: 'none',
            }}
          >
            PNG
          </div>
          <div
            style={{
              position: 'absolute',
              right: '8px',
              fontSize: '8px',
              fontWeight: '700',
              color: exportFormat === 'svg' ? '#000000' : 'rgb(102, 102, 102)',
              transition: 'color 0.3s ease',
              pointerEvents: 'none',
            }}
          >
            SVG
          </div>
        </div>
      </button>
    </div>
  );
}

export const FlowPlanner: React.FC = () => {
  // Simple state for canvas list - shared between menu and left panel
  const [canvases, setCanvases] = React.useState<Array<{id: string, title: string}>>([]);
  const [currentCanvasId, setCurrentCanvasId] = React.useState<string>('');
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const [editingCanvasId, setEditingCanvasId] = React.useState<string | null>(null);
  const editorRef = React.useRef<Editor | null>(null);
  const { user: _user, signOut } = useAuthContext();
  // Use local state for sidebar
  const [sidebarVisible, setSidebarVisible] = React.useState(true);

  // Use cloud sync for the current canvas
  const { store: syncStore } = useCloudSync({
    roomId: currentCanvasId || 'default',
    userId: _user?.id,
  });
  
  // Load canvases from localStorage on mount
  React.useEffect(() => {
    console.log('Loading canvases from localStorage...');
    const savedCanvases = localStorage.getItem('yoga_flow_canvas_list');
    console.log('Saved canvases:', savedCanvases);
    
    if (savedCanvases) {
      try {
        const parsed = JSON.parse(savedCanvases);
        console.log('Parsed canvases:', parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrate existing canvases to remove emoji
          const migratedCanvases = parsed.map((canvas: any) => ({
            id: canvas.id,
            title: canvas.title || 'Untitled Canvas'
          }));
          setCanvases(migratedCanvases);
          // Set current canvas to the first one, or the last one that was active
          const lastActiveCanvas = localStorage.getItem('yoga_flow_current_canvas');
          console.log('Last active canvas:', lastActiveCanvas);
          if (lastActiveCanvas && migratedCanvases.find(c => c.id === lastActiveCanvas)) {
            setCurrentCanvasId(lastActiveCanvas);
          } else {
            setCurrentCanvasId(migratedCanvases[0].id);
          }
        } else {
          // No valid saved canvases, create default
          const defaultCanvases = [{ id: 'default', title: 'Yoga Flow' }];
          setCanvases(defaultCanvases);
          setCurrentCanvasId('default');
        }
      } catch (err) {
        console.error('Error loading canvases:', err);
        // Error loading, create default
        const defaultCanvases = [{ id: 'default', title: 'Yoga Flow' }];
        setCanvases(defaultCanvases);
        setCurrentCanvasId('default');
      }
    } else {
      // No saved data, create default
      const defaultCanvases = [{ id: 'default', title: 'Yoga Flow' }];
      setCanvases(defaultCanvases);
      setCurrentCanvasId('default');
    }
    
    setIsInitialized(true);
  }, []);

  // Save canvases to localStorage whenever they change (but only after initialization)
  React.useEffect(() => {
    if (isInitialized) {
      console.log('Saving canvases to localStorage:', canvases);
      localStorage.setItem('yoga_flow_canvas_list', JSON.stringify(canvases));
    }
  }, [canvases, isInitialized]);

  // Save current canvas ID whenever it changes (but only after initialization)
  React.useEffect(() => {
    if (isInitialized) {
      console.log('Saving current canvas ID:', currentCanvasId);
      localStorage.setItem('yoga_flow_current_canvas', currentCanvasId);
    }
  }, [currentCanvasId, isInitialized]);

  // Listen for createNewCanvas events from the main menu
  React.useEffect(() => {
    const handleCreateNewCanvas = () => {
      handleCreateCanvas();
    };

    window.addEventListener('createNewCanvas', handleCreateNewCanvas);
    return () => {
      window.removeEventListener('createNewCanvas', handleCreateNewCanvas);
    };
  }, []);

  // Handle creating a new canvas
  const handleCreateCanvas = async () => {
    console.log('Create New Canvas button clicked!');
    const newCanvas = {
      id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Untitled Canvas'
    };
    console.log('Creating new canvas:', newCanvas);
    
    // Update the canvas list
    setCanvases(prev => {
      const updated = [...prev, newCanvas];
      console.log('Updated canvases after create:', updated);
      return updated;
    });
    
    // Switch to new canvas
    setCurrentCanvasId(newCanvas.id);
    
    // Activate inline editing for the new canvas
    setEditingCanvasId(newCanvas.id);
  };

  // Handle updating canvas title
  const updateCanvas = (canvasId: string, updates: { title?: string }) => {
    setCanvases(prev => prev.map(canvas => 
      canvas.id === canvasId 
        ? { ...canvas, ...updates }
        : canvas
    ));
  };

  const handleMount = (mountedEditor: Editor) => {
    editorRef.current = mountedEditor;
    
    // Enable debug logging
    mountedEditor.updateInstanceState({ isGridMode: true });
    
    
    
    // Ensure only one page per canvas - remove extra pages
    const pages = mountedEditor.getPages();
    if (pages.length > 1) {
      const currentPageId = mountedEditor.getCurrentPageId();
      pages.forEach(page => {
        if (page.id !== currentPageId) {
          mountedEditor.deletePage(page.id);
        }
      });
    }
    
    console.log('🚀 Editor mounted with debug logging enabled');
  };

  const components = React.useMemo(() => createComponents(sidebarVisible), [sidebarVisible]);

  // Canvas context value
  const canvasContextValue: CanvasContextType = {
    canvases,
    currentCanvasId,
    setCanvases,
    setCurrentCanvasId,
  };

  React.useEffect(() => {
    const handler = () => setSidebarVisible(v => !v);
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

  // Calculate button position
  const left = sidebarVisible ? 220 : 52; // 40px padding + 8px gap + 4px offset
  const top = 44;

  return (
    <>
      <style>{`
        @keyframes sunriseBreath {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.06); }
          100% { filter: brightness(1); }
        }
        .sunrise-bg {
          background:
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='none'><filter id='noiseFilter'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noiseFilter)' opacity='0.40'/><rect width='100%' height='100%' fill='%23ffb347' opacity='0.18'/></svg>") repeat,
            linear-gradient(180deg, #ffecd2 0%, #fcb69f 40%, #ffdde1 100%);
          animation: sunriseBreath 8s ease-in-out infinite;
          min-height: 100vh;
          width: 100vw;
        }
      `}</style>
      <div className="sunrise-bg" style={{ minHeight: '100vh', width: '100vw' }}>
        <CanvasContext.Provider value={canvasContextValue}>
          <div 
            className="tldraw__editor h-screen w-screen"
            style={{
              display: 'flex',
              width: '100vw',
              height: '100vh',
              padding: sidebarVisible ? '40px 40px 40px 8px' : '40px',
              backgroundColor: 'transparent',
              gap: '16px',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Sidebar Toggle Button - Absolutely positioned, invisible */}
            <button
              onClick={() => setSidebarVisible(v => !v)}
              style={{
                position: 'absolute',
                left,
                top,
                zIndex: 101,
                width: '32px',
                height: '32px',
                background: 'transparent',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                outline: 'none',
              }}
              title={sidebarVisible ? 'Hide sidebar (fullscreen)' : 'Show sidebar'}
            />
            {/* Sidebar (Canvas Title Menu - Left Side) */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: sidebarVisible ? '200px' : '0px',
                minWidth: sidebarVisible ? '200px' : '0px',
                maxWidth: sidebarVisible ? '200px' : '0px',
                height: '100%',
                padding: '0',
                backgroundColor: 'transparent',
                border: 'none',
                gap: '8px',
                opacity: sidebarVisible ? 1 : 0,
                pointerEvents: sidebarVisible ? 'auto' : 'none',
              }}
            >
              {/* Canvas List and Create Button Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                {/* Create New Canvas Button - At top */}
                <SidebarButton
                  onClick={handleCreateCanvas}
                  icon={<Plus size={16} style={{ opacity: 0.5 }} />}
                  text="Add canvas"
                  title="Add canvas"
                  boxShadow="var(--shadow-neumorphic)"
                  activeBoxShadow="var(--shadow-neumorphic-inset)"
                />

                {/* Canvas List - Sorted alphabetically */}
                {canvases
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((canvas) => {
                    const isEditing = editingCanvasId === canvas.id;
                    
                    return (
                      <div
                        key={canvas.id}
                        className={`text-primary text-left cursor-pointer transition-fast whitespace-nowrap overflow-hidden text-ellipsis h-7 flex justify-start items-center mb-0.5 backdrop-blur-md rounded-lg ${
                          currentCanvasId === canvas.id 
                            ? 'bg-glass shadow-neumorphic' 
                            : 'bg-transparent'
                        }`}
                        style={{
                          width: 'auto',
                          minWidth: '120px',
                          maxWidth: '180px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          fontFamily: 'var(--font-system)',
                          borderRadius: '8px',
                          border: 'none',
                          marginBottom: '2px',
                        }}
                        onMouseEnter={(e) => {
                          if (currentCanvasId !== canvas.id && !isEditing) {
                            e.currentTarget.style.backgroundColor = 'var(--bg-glass)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentCanvasId !== canvas.id && !isEditing) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                        onClick={(e) => {
                          if (!isEditing) {
                            setCurrentCanvasId(canvas.id);
                            // Reset any hover state
                            const element = e.currentTarget as HTMLElement;
                            if (element && currentCanvasId !== canvas.id) {
                              element.style.backgroundColor = 'transparent';
                            }
                          }
                        }}
                      >
                        <EditableCanvasTitle
                          title={canvas.title}
                          onSave={(newTitle) => {
                            updateCanvas(canvas.id, { title: newTitle });
                          }}
                          isEditing={editingCanvasId === canvas.id}
                          onStartEdit={() => setEditingCanvasId(canvas.id)}
                          onCancelEdit={() => setEditingCanvasId(null)}
                          className="text-primary h-7 flex items-center mb-0.5"
                        />
                      </div>
                    );
                  })}
              </div>

              {/* Account Settings Button - Expandable */}
              {_user && (
                <div style={{ 
                  width: '100%',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '-2px -2px 10px rgba(255, 248, 220, 1), 3px 3px 10px rgba(255, 69, 0, 0.4)',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => {
                      console.log('Account Settings button clicked')
                      setIsAccountMenuOpen(!isAccountMenuOpen)
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      color: '#885050',
                      border: 'none',
                      borderRadius: isAccountMenuOpen ? '8px 8px 0 0' : '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'var(--font-system)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      height: '40px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0px',
                    }}
                    title="Account Settings"
                  >
                    <span style={{ flex: '1', textAlign: 'left' }}>Account Settings</span>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {isAccountMenuOpen ? (
                        <X 
                          size={16} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAccountMenuOpen(false);
                          }}
                          style={{ cursor: 'pointer', opacity: 0.5 }}
                        />
                      ) : (
                        <MoreVertical size={16} style={{ opacity: 0.5 }} />
                      )}
                    </span>
                  </button>
                  
                  {/* Expandable Account Settings Content */}
                  <div
                    style={{
                      width: '100%',
                      maxHeight: isAccountMenuOpen ? '400px' : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
                      opacity: isAccountMenuOpen ? 1 : 0,
                      transform: isAccountMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '0 0 8px 8px',
                    }}
                  >
                    <div style={{ padding: '4px 8px 8px 8px' }}>
                      {/* Email (read-only) */}
                      <div style={{ marginBottom: '0px' }}>
                        <input
                          type="email"
                          value={_user.email || ''}
                          disabled
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            fontSize: '11px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#BD8F8E',
                            border: 'none',
                            borderRadius: '6px',
                            boxSizing: 'border-box',
                            fontFamily: 'var(--font-system)',
                          }}
                        />
                      </div>

                      {/* Account Actions */}
                      <div style={{
                        borderTop: '1px solid var(--color-divider)',
                        paddingTop: '12px',
                      }}>
                        <button
                          onClick={async () => {
                            const result = await signOut();
                            if (result.error) {
                              console.error('Sign out error:', result.error);
                            }
                            setIsAccountMenuOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: 'transparent',
                            color: '#885050',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                            marginBottom: '6px',
                            height: '32px',
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            fontFamily: 'var(--font-system)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Sign Out
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                              // TODO: Implement account deletion
                              console.log('Account deletion not implemented yet');
                              setIsAccountMenuOpen(false);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: 'transparent',
                            color: '#885050',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                            height: '32px',
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            fontFamily: 'var(--font-system)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Canvas - Right Side */}
            <div 
              style={{
                flex: '1',
                backgroundColor: 'hsla(39, 88%, 97%, 1)',
                borderRadius: '12px',
                overflow: 'hidden',
                //boxShadow: 'var(--shadow-neumorphic)',
              }}
            >
              <Tldraw
                // Use the sync store instead of local store
                store={syncStore}
                // Pass in the array of custom tool classes
                tools={customTools}
                // Pass in custom shape utilities
                shapeUtils={customShapeUtils}
                // Pass in our ui overrides
                overrides={uiOverrides}
                // Pass in our custom components
                components={{
                  ...components,
                  // You can add a custom UI slot here if needed
                }}
                // Pass in our custom asset urls
                assetUrls={customAssetUrls}
                // Enable built-in grid
                onMount={handleMount}
              >
              </Tldraw>
            </div>
            
            {/* Floating Export Button - Outside canvas container */}
            <FloatingExportButton editor={editorRef.current} />
          </div>
        </CanvasContext.Provider>
      </div>
    </>
  );
};