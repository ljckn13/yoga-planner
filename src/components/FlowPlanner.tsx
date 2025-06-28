import React, { useLayoutEffect, useRef, createContext, useContext, useCallback } from 'react';
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
import { useAutoSave } from '../hooks/useAutoSave';
import { useAuthContext } from './AuthProvider';
import { ArrowUpLeft, ArrowDownRight, Plus, X, MoreVertical, Folder, FolderOpen, Trash } from 'lucide-react';
import { useCanvasManager } from '../hooks/useCanvasManager';

// Temporary debug function to clear localStorage
const clearLocalStorage = () => {
  console.log('🧹 Clearing localStorage...');
  localStorage.clear();
  console.log('✅ localStorage cleared');
  window.location.reload();
};

// Debug function to log current state
const logCurrentState = () => {
  console.log('📊 [DEBUG] Current State Dump:');
  console.log('📊 [DEBUG] - Canvases in localStorage:', Object.keys(localStorage).filter(key => key.startsWith('yoga_flow_canvas_')));
  console.log('📊 [DEBUG] - Canvas list in localStorage:', localStorage.getItem('yoga_flow_canvas_list'));
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).clearLocalStorage = clearLocalStorage;
  (window as any).logCurrentState = logCurrentState;
}

// Canvas context to share state between components
interface CanvasContextType {
  canvases: Array<{id: string, title: string, folderId?: string | null, createdAt?: Date}>;
  currentCanvasId: string;
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
function useCurrentCanvasTitle() {
  const [canvasTitle, setCanvasTitle] = React.useState('Untitled Flow');
  const { canvases, currentCanvasId } = useCanvasContext();
  
  React.useEffect(() => {
    const currentCanvas = canvases.find((canvas) => canvas.id === currentCanvasId);
    if (currentCanvas && currentCanvas.title) {
            setCanvasTitle(currentCanvas.title);
          } else {
            setCanvasTitle('Untitled Flow');
          }
  }, [canvases, currentCanvasId]);
  
  return canvasTitle;
}

// Custom page menu that shows canvas title and main menu side by side
function CustomPageMenu({ sidebarVisible }: { sidebarVisible: boolean }) {
  const editor = useEditor();
  const canvasTitle = useCurrentCanvasTitle();
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
  const { canvases, currentCanvasId, setCurrentCanvasId } = useCanvasContext();

  const handleDeleteCanvas = async () => {
    if (canvases.length <= 1) {
      alert('Cannot delete the last canvas. Create a new one first.');
      return;
    }
    
    const currentCanvas = canvases.find(c => c.id === currentCanvasId);
    if (!currentCanvas) return;
    
    if (confirm(`Are you sure you want to delete "${currentCanvas.title}"?`)) {
      console.log('Deleting canvas:', currentCanvas);
      // Note: Canvas deletion is handled by the manager, not local state
      // The manager will update the canvas list automatically
      const remainingCanvases = canvases.filter(c => c.id !== currentCanvasId);
      if (remainingCanvases.length > 0) {
        setCurrentCanvasId(remainingCanvases[0].id);
      }
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
  const [currentCanvasId, setCurrentCanvasId] = React.useState<string>('');
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const [editingCanvasId, setEditingCanvasId] = React.useState<string | null>(null);
  const [folderMenuOpen, setFolderMenuOpen] = React.useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = React.useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = React.useState<string>('');
  const [openFolders, setOpenFolders] = React.useState<Set<string>>(new Set());
  const [manuallyOpenedFolders, setManuallyOpenedFolders] = React.useState<Set<string>>(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [newlyCreatedCanvases, setNewlyCreatedCanvases] = React.useState<Set<string>>(new Set());
  const editorRef = React.useRef<Editor | null>(null);
  const previousCanvasFolderRef = React.useRef<string | null | undefined>(undefined);
  const { user: _user, signOut } = useAuthContext();
  // Use local state for sidebar
  const [sidebarVisible, setSidebarVisible] = React.useState(true);

  // Track the editor instance in state to prevent useCanvasManager from being recreated
  const [editorInstance, setEditorInstance] = React.useState<Editor | null>(null);

  // Stabilize the options object to prevent useCanvasManager from being recreated
  const canvasManagerOptions = React.useMemo(() => ({
    userId: _user?.id,
    enableSupabase: !!_user, // Enable Supabase when user is signed in, with localStorage fallback
  }), [_user?.id, !!_user]);

  // Use canvas manager for folder and canvas operations
  const {
    folders,
    canvases: managerCanvases,
    currentCanvas,
    createFolder,
    updateFolder,
    deleteFolder,
    createCanvas: createCanvasInManager,
    updateCanvas: updateCanvasInManager,
    switchCanvas: switchCanvasInManager,
    deleteCanvas: deleteCanvasInManager,
  } = useCanvasManager(editorInstance, canvasManagerOptions);

  // Convert manager canvases to the format expected by the UI
  const canvases = React.useMemo(() => {
    const converted = managerCanvases.map(canvas => ({
      id: canvas.metadata.id,
      title: canvas.metadata.title,
      folderId: canvas.metadata.folderId || null,
      createdAt: canvas.metadata.createdAt
    }));
    
    return converted;
  }, [managerCanvases]);

  // Auto-save for the current canvas
  useAutoSave(editorInstance, {
    canvasId: currentCanvasId,
  });

  // Stabilize the roomId to prevent unnecessary useCloudSync recreations
  const stableRoomId = React.useMemo(() => {
    return currentCanvasId || 'default';
  }, [currentCanvasId]);

  // Update current canvas ID when manager's current canvas changes
  React.useEffect(() => {
    if (currentCanvas && currentCanvasId !== currentCanvas.metadata.id) {
      console.log('🔄 [DEBUG] FlowPlanner: Syncing current canvas ID:', currentCanvas.metadata.id);
      setCurrentCanvasId(currentCanvas.metadata.id);
    }
  }, [currentCanvas, currentCanvasId]);

  // Manage folder open/close state and cleanup when switching between folders
  React.useEffect(() => {
    if (currentCanvasId) {
      const canvas = canvases.find(c => c.id === currentCanvasId);
      const currentFolderId = canvas?.folderId || null;
      
      // Check if we switched from one folder to another folder
      const previousFolderId = previousCanvasFolderRef.current;
      const switchedBetweenFolders = 
        previousFolderId !== undefined && // Not initial load
        previousFolderId !== currentFolderId && // Actually changed
        previousFolderId !== null && // Previous was in a folder
        currentFolderId !== null; // Current is also in a folder
      
      // Update the ref for next time
      previousCanvasFolderRef.current = currentFolderId;
      
      if (switchedBetweenFolders) {
        // Clean up manually opened folders when switching between different folders
        setManuallyOpenedFolders(prev => {
          const newManualSet = new Set<string>();
          
          // Keep manually opened folders that are either:
          // 1. The same as the current canvas folder
          // 2. Empty folders (always allowed to stay open)
          prev.forEach(folderId => {
            if (folderId === currentFolderId) {
              newManualSet.add(folderId); // Keep if same as current canvas folder
            } else {
              const folderCanvases = canvases.filter(c => c.folderId === folderId);
              if (folderCanvases.length === 0) {
                newManualSet.add(folderId); // Keep empty folders
              }
              // Non-empty folders in different location get removed when canvas switches
            }
          });
          
          console.log('📁 [DEBUG] Cleaned up manually opened folders on folder switch:', {
            from: previousFolderId,
            to: currentFolderId,
            before: Array.from(prev),
            after: Array.from(newManualSet)
          });
          
          return newManualSet;
        });
      }
      
      // Apply folder display rules (using setTimeout to ensure manual cleanup happens first)
      setTimeout(() => {
        if (canvas && canvas.folderId) {
          // Canvas is in a folder - apply folder opening rules
          setOpenFolders(prev => {
            const newSet = new Set<string>();
            
            // Rule 1: Always keep the current canvas's folder open
            newSet.add(canvas.folderId!);
            
            // Keep manually opened folders open (user might be browsing)
            setManuallyOpenedFolders(currentManual => {
              currentManual.forEach(folderId => {
                newSet.add(folderId);
              });
              return currentManual; // Don't change manual state
            });
            
            // Exception: Keep empty folders open regardless
            prev.forEach(folderId => {
              if (!newSet.has(folderId)) {
                const folderCanvases = canvases.filter(c => c.folderId === folderId);
                if (folderCanvases.length === 0) {
                  newSet.add(folderId); // Keep empty folders open
                }
              }
            });
            
            return newSet;
          });
        } else {
          // Rule 2: Top-level canvas is active - close ALL folders
          setOpenFolders(prev => {
            const newSet = new Set<string>();
            
            // When top-level canvas is active, close all folders completely
            // Clear manually opened tracking as well since folders should be closed
            setManuallyOpenedFolders(prev => {
              if (prev.size > 0) {
                console.log('📁 [DEBUG] Top-level canvas active - closing all folders and clearing manual tracking');
              }
              return new Set<string>();
            });
            
            console.log('📁 [DEBUG] Top-level canvas active - all folders closed');
            return newSet;
          });
        }
      }, 0);
    }
  }, [currentCanvasId, canvases]);



  // Set initialized when manager loads data
  React.useEffect(() => {
    if (managerCanvases.length > 0) {
      console.log('📊 [DEBUG] FlowPlanner: Setting initialized to true');
      setIsInitialized(true);
    }
  }, [managerCanvases]);

  // Handle creating a new canvas within a folder
  const handleCreateCanvasInFolder = async (folderId: string) => {
    console.log('Create New Canvas in Folder button clicked!', folderId);
    try {
      // Clean up any existing empty canvases first
      await cleanupEmptyCanvases();
      
      // Apply rules when opening the folder for canvas creation
      setOpenFolders(prev => {
        const newSet = new Set<string>();
        const currentCanvas = canvases.find(c => c.id === currentCanvasId);
        const currentCanvasFolderId = currentCanvas?.folderId;
        
        // Open the target folder
        newSet.add(folderId);
        
        // If current canvas is in a different folder, only keep that folder if it's not empty
        if (currentCanvasFolderId && currentCanvasFolderId !== folderId) {
          const currentFolderCanvases = canvases.filter(c => c.folderId === currentCanvasFolderId);
          if (currentFolderCanvases.length === 0) {
            newSet.add(currentCanvasFolderId); // Keep empty folder open
          }
        }
        
        console.log('📁 [DEBUG] Opening folder for canvas creation with rules:', folderId);
        return newSet;
      });

      const newCanvasId = await createCanvasInManager('Untitled Flow', folderId);
      console.log('Created new canvas in folder with ID:', newCanvasId);
      
      // Track as newly created for potential cleanup
      setNewlyCreatedCanvases(prev => {
        const newSet = new Set(prev);
        newSet.add(newCanvasId);
        return newSet;
      });
      
      // Switch to the new canvas immediately
      await handleSwitchCanvas(newCanvasId);
      
      // Activate inline editing for the new canvas
      setEditingCanvasId(newCanvasId);
    } catch (error) {
      console.error('Failed to create canvas in folder:', error);
      alert('Failed to create canvas in folder');
    }
  };

  // Handle updating canvas title
  const updateCanvas = async (canvasId: string, updates: { title?: string }) => {
    try {
      await updateCanvasInManager(canvasId, updates);
    } catch (error) {
      console.error('Failed to update canvas:', error);
      alert('Failed to update canvas');
    }
  };

  // Handle deleting canvas
  const handleDeleteCanvas = async (canvasId: string) => {
    if (!confirm('Are you sure you want to delete this canvas?')) {
      return;
    }
    
    try {
      await deleteCanvasInManager(canvasId);
      
      // Clear editing state if we were editing this canvas
      if (editingCanvasId === canvasId) {
        setEditingCanvasId(null);
      }
    } catch (error) {
      console.error('Failed to delete canvas:', error);
      alert('Failed to delete canvas');
    }
  };

  // Folder management functions
  const handleCreateFolder = async () => {
    if (folders.length >= 10) {
      alert('Max 10 folders per workspace');
      return;
    }
    
    if (!newFolderName.trim()) return;
    
    try {
      const newFolderId = await createFolder(newFolderName.trim());
      
      // Apply rules when opening the newly created folder
      setOpenFolders(prev => {
        const newSet = new Set<string>();
        const currentCanvas = canvases.find(c => c.id === currentCanvasId);
        const currentCanvasFolderId = currentCanvas?.folderId;
        
        // Always open the new folder
        newSet.add(newFolderId);
        
        // Keep current canvas folder open if it exists
        if (currentCanvasFolderId) {
          newSet.add(currentCanvasFolderId);
        }
        
        console.log('📁 [DEBUG] Auto-opening newly created folder with rules:', newFolderId);
        return newSet;
      });
      
      // Track as manually opened
      setManuallyOpenedFolders(prev => {
        const newSet = new Set(prev);
        newSet.add(newFolderId);
        return newSet;
      });
      
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const handleUpdateFolder = async (folderId: string, newName: string) => {
    if (!newName.trim()) return;
    
    try {
      await updateFolder(folderId, { name: newName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    } catch (error) {
      console.error('Failed to update folder:', error);
      alert('Failed to update folder');
    }
  };

  const handleStartFolderEdit = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingFolderName(currentName);
  };

  const handleCancelFolderEdit = () => {
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleSaveFolderEdit = async (folderId: string) => {
    if (!editingFolderName.trim()) return;
    
    try {
      await updateFolder(folderId, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    } catch (error) {
      console.error('Failed to update folder:', error);
      alert('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    // Check if folder is empty
    const folderCanvases = canvases.filter(canvas => canvas.folderId === folderId);
    if (folderCanvases.length > 0) {
      alert('Only empty folders can be deleted');
      return;
    }
    
    if (confirm('Are you sure you want to delete this folder?')) {
      try {
        await deleteFolder(folderId);
      } catch (error) {
        console.error('Failed to delete folder:', error);
        alert('Failed to delete folder');
      }
    }
  };

  const toggleFolder = (folderId: string) => {
    // Clean up empty canvases when user opens/closes folders
    cleanupEmptyCanvases();
    
    setOpenFolders(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(folderId)) {
        // Closing a folder
        newSet.delete(folderId);
        
        // Remove from manually opened tracking
        setManuallyOpenedFolders(prevManual => {
          const newManualSet = new Set(prevManual);
          newManualSet.delete(folderId);
          return newManualSet;
        });
        
        console.log('📁 [DEBUG] Manually closed folder:', folderId);
      } else {
        // Opening a folder
        newSet.add(folderId);
        
        // Track as manually opened
        setManuallyOpenedFolders(prevManual => {
          const newManualSet = new Set(prevManual);
          newManualSet.add(folderId);
          return newManualSet;
        });
        
        console.log('📁 [DEBUG] Manually opened folder:', folderId);
      }
      
      return newSet;
    });
  };

  // Handle creating a new canvas at root level
  const handleCreateCanvasAtRoot = async () => {
    console.log('Create New Canvas at Root button clicked!');
    try {
      // Clean up any existing empty canvases first
      await cleanupEmptyCanvases();
      
      const newCanvasId = await createCanvasInManager('Untitled Flow');
      console.log('Created new canvas at root with ID:', newCanvasId);
    
      // Track as newly created for potential cleanup
      setNewlyCreatedCanvases(prev => {
        const newSet = new Set(prev);
        newSet.add(newCanvasId);
        return newSet;
      });
      
      // Switch to the new canvas immediately
      await handleSwitchCanvas(newCanvasId);
      
      // Activate inline editing for the new canvas
      setEditingCanvasId(newCanvasId);
    } catch (error) {
      console.error('Failed to create canvas at root:', error);
      alert('Failed to create canvas');
    }
  };

  const handleMount = (mountedEditor: Editor) => {
    editorRef.current = mountedEditor;
    setEditorInstance(mountedEditor);
    
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
    setCurrentCanvasId,
  };

  React.useEffect(() => {
    const handler = () => setSidebarVisible(v => !v);
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Clear editor instance on unmount
      setEditorInstance(null);
    };
  }, []);

  // Calculate button position
  const left = sidebarVisible ? 220 : 52; // 40px padding + 8px gap + 4px offset
  const top = 44;

  // Debug panel state
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);

  // Helper function to check if a canvas is empty
  const isCanvasEmpty = React.useCallback((canvasId: string): boolean => {
    if (!editorInstance || currentCanvasId !== canvasId) {
      // For non-current canvases, check localStorage
      const storageKey = `yoga_flow_canvas_${canvasId}`;
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) return true; // No saved data = empty
      
      try {
        const canvasState = JSON.parse(savedData);
        if (!canvasState.snapshot || !canvasState.snapshot.store) return true;
        
        // Check if there are any shapes in the store
        const shapes = Object.values(canvasState.snapshot.store).filter((record: any) => 
          record && record.typeName === 'shape'
        );
        return shapes.length === 0;
      } catch {
        return true; // Error parsing = treat as empty
      }
    }
    
    // For current canvas, check editor directly
    const shapeIds = editorInstance.getCurrentPageShapeIds();
    return shapeIds.size === 0;
  }, [editorInstance, currentCanvasId]);

  // Clean up empty canvases when user takes other actions
  const cleanupEmptyCanvases = React.useCallback(async (excludeCanvasId?: string) => {
    const canvasesToCleanup: string[] = [];
    
    // Check all newly created canvases
    newlyCreatedCanvases.forEach(canvasId => {
      if (canvasId !== excludeCanvasId && isCanvasEmpty(canvasId)) {
        canvasesToCleanup.push(canvasId);
      }
    });
    
    // Clean them up
    for (const canvasId of canvasesToCleanup) {
      try {
        console.log('🗑️ [DEBUG] Auto-cleaning up empty canvas:', canvasId);
        await deleteCanvasInManager(canvasId);
        
        // Remove from newly created tracking
        setNewlyCreatedCanvases(prev => {
          const newSet = new Set(prev);
          newSet.delete(canvasId);
          return newSet;
        });
        
        // Clear editing state if we were editing this canvas
        if (editingCanvasId === canvasId) {
          setEditingCanvasId(null);
        }
      } catch (error) {
        console.error('Error cleaning up empty canvas:', error);
      }
    }
  }, [newlyCreatedCanvases, isCanvasEmpty, deleteCanvasInManager, editingCanvasId]);

  // Simplified canvas switching function
  const handleSwitchCanvas = React.useCallback(async (canvasId: string) => {
    if (currentCanvasId === canvasId) return;
    
    try {
      // Clean up empty canvases before switching (excluding the target canvas)
      await cleanupEmptyCanvases(canvasId);
      
      await switchCanvasInManager(canvasId);
      console.log('✅ [DEBUG] FlowPlanner: Successfully switched to canvas:', canvasId);
      
      // Remove the target canvas from newly created tracking since it's now being used
      setNewlyCreatedCanvases(prev => {
        const newSet = new Set(prev);
        newSet.delete(canvasId);
        return newSet;
      });
    } catch (error) {
      console.error('❌ [DEBUG] FlowPlanner: Failed to switch canvas:', error);
    }
  }, [currentCanvasId, switchCanvasInManager, cleanupEmptyCanvases]);

  // Remove canvas from newly created tracking when it gets content
  React.useEffect(() => {
    if (!editorInstance || !currentCanvasId) return;
    
    // Check if current canvas has content and remove from newly created tracking
    const checkCanvasContent = () => {
      if (newlyCreatedCanvases.has(currentCanvasId)) {
        const shapeIds = editorInstance.getCurrentPageShapeIds();
        if (shapeIds.size > 0) {
          // Canvas now has content, remove from newly created tracking
          setNewlyCreatedCanvases(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentCanvasId);
            console.log('✏️ [DEBUG] Canvas now has content, removing from cleanup tracking:', currentCanvasId);
            return newSet;
          });
        }
      }
    };
    
    // Check immediately and on changes
    checkCanvasContent();
    
    // Listen for changes in the editor
    const cleanup = editorInstance.store.listen(() => {
      checkCanvasContent();
    }, { source: 'user', scope: 'document' });
    
    return cleanup;
  }, [editorInstance, currentCanvasId, newlyCreatedCanvases]);

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
            {/* Debug Panel Toggle */}
            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                zIndex: 1000,
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #885050',
                borderRadius: '6px',
                color: '#885050',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-system)',
              }}
              title="Toggle Debug Panel"
            >
              🐛 Debug
            </button>

            {/* Debug Panel */}
            {showDebugPanel && (
              <div style={{
                position: 'absolute',
                right: '20px',
                top: '60px',
                zIndex: 1000,
                width: '300px',
                maxHeight: '400px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #885050',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '11px',
                fontFamily: 'var(--font-system)',
                overflow: 'auto',
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#885050', fontSize: '12px' }}>Debug Info</h4>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Current Canvas:</strong> {currentCanvasId}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Total Canvases:</strong> {canvases.length}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Folders:</strong> {folders.length}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>User:</strong> {_user ? _user.email : 'Not signed in'}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => {
                      console.log('📊 [DEBUG] Manual state dump triggered');
                      logCurrentState();
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#885050',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    Log State
                  </button>
                  <button
                    onClick={() => {
                      console.log('🧹 [DEBUG] Manual localStorage clear triggered');
                      clearLocalStorage();
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ff6b6b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Storage
                  </button>
                </div>
              </div>
            )}

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
                {/* Folders Section */}
                {_user && (
                  <>
                    {/* Folders Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                      marginBottom: '4px',
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#885050',
                        fontFamily: 'var(--font-system)',
                      }}>
                        Folders
                      </span>
                      <button
                        onClick={() => setIsCreatingFolder(true)}
                        disabled={folders.length >= 10}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '16px',
                          height: '16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: folders.length >= 10 ? 'not-allowed' : 'pointer',
                          color: '#885050',
                          opacity: folders.length >= 10 ? 0.3 : 0.7,
                          fontSize: '12px',
                          fontFamily: 'var(--font-system)',
                        }}
                        title={folders.length >= 10 ? 'Max 10 folders' : 'Create folder'}
                      >
                        ＋
                      </button>
                    </div>

                    {/* Create Folder Input */}
                    {isCreatingFolder && (
                      <div style={{
                        marginBottom: '8px',
                        padding: '6px 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}>
                        <input
                          type="text"
                          placeholder="Folder name"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFolder();
                            if (e.key === 'Escape') {
                              setIsCreatingFolder(false);
                              setNewFolderName('');
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '11px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#885050',
                            fontFamily: 'var(--font-system)',
                          }}
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Folders List */}
                    {folders.length > 0 && folders
                      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                      .map((folder, index) => {
                        const isEditing = editingFolderId === folder.id;
                        const isOpen = openFolders.has(folder.id);
                        const folderCanvases = canvases.filter(canvas => canvas.folderId === folder.id);
                        
                        return (
                          <div key={folder.id} style={{ 
                            width: '100%',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            boxShadow: '-2px -2px 10px rgba(255, 248, 220, 1), 3px 3px 10px rgba(255, 69, 0, 0.4)',
                            marginBottom: index < folders.length - 1 ? '10px' : '0px', // 2px more gap
                            position: 'relative',
                          }}>
                            {/* Folder Button */}
                            <button
                              onClick={() => {
                                if (!isEditing) {
                                  toggleFolder(folder.id);
                                }
                              }}
                              onDoubleClick={() => {
                                if (!isEditing) {
                                  handleStartFolderEdit(folder.id, folder.name);
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '6px 12px',
                                backgroundColor: 'transparent',
                                color: '#885050',
                                border: 'none',
                                borderRadius: isOpen ? '8px 8px 0 0' : '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                fontFamily: 'var(--font-system)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.1s ease',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                height: '40px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0px',
                              }}
                              title={folder.name}
                            >
                              <span style={{ flex: '1', textAlign: 'left' }}>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingFolderName}
                                    onChange={(e) => setEditingFolderName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveFolderEdit(folder.id);
                                      if (e.key === 'Escape') handleCancelFolderEdit();
                                    }}
                                    onBlur={() => handleSaveFolderEdit(folder.id)}
                                    style={{
                                      width: '100%',
                                      padding: '2px 4px',
                                      fontSize: '12px',
                                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                      border: 'none',
                                      borderRadius: '4px',
                                      color: '#885050',
                                      fontFamily: 'var(--font-system)',
                                      fontWeight: '600',
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  folder.name
                                )}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {!isEditing && folderCanvases.length === 0 && (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFolder(folder.id);
                                    }}
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      borderRadius: '2px',
                                      cursor: 'pointer',
                                      color: '##e2e8f0',
                                      opacity: 0.5,
                                      fontSize: '10px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                    }}
                                    title="Delete folder"
                                  >
                                    <Trash size={12} style={{ opacity: 0.5 }} />
                                  </div>
                                )}
                                {!isEditing && folderCanvases.length > 0 && (
                                  <span style={{ fontSize: '12px', opacity: 0.5, fontWeight: 'normal' }}>
                                    {folderCanvases.length}
                                  </span>
                                )}
                              </span>
                            </button>
                            
                            {/* Folder Content */}
                            <div
                              style={{
                                width: '100%',
                                maxHeight: isOpen ? '400px' : '0px',
                                transition: 'max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
                                opacity: isOpen ? 1 : 0,
                                transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '0 0 8px 8px',
                              }}
                            >
                              {folderCanvases.length > 0 && (
                                <div style={{ padding: '0px 8px 8px 8px' }}>
                                  {/* Folder Canvases */}
                                  {folderCanvases
                                    .sort((a, b) => {
                                      // Sort by creation date (newest first) instead of title to maintain consistent order
                                      const aDate = new Date(a.createdAt || 0);
                                      const bDate = new Date(b.createdAt || 0);
                                      return bDate.getTime() - aDate.getTime();
                                    })
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
                                            padding: '8px 10px',
                                            fontSize: '11px',
                          fontWeight: '500',
                          fontFamily: 'var(--font-system)',
                                            borderRadius: '6px',
                          border: 'none',
                                            marginBottom: '4px',
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
                                                                    onClick={() => {
                            if (!isEditing) {
                              handleSwitchCanvas(canvas.id);
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
                                          {currentCanvasId === canvas.id && !isEditing && (
                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCanvas(canvas.id);
                                              }}
                                              style={{
                                                width: '16px',
                                                height: '16px',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                borderRadius: '2px',
                                                cursor: 'pointer',
                                                color: '#885050',
                                                opacity: 0.5,
                                                fontSize: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0,
                                                marginLeft: '4px',
                                              }}
                                              title="Canvas options"
                                            >
                                              <MoreVertical size={12} style={{ opacity: 0.5 }} />
                                            </div>
                                          )}
                      </div>
                    );
                  })}
                                  
                                  {/* Create New Canvas Button */}
                                  <button
                                    onClick={() => handleCreateCanvasInFolder(folder.id)}
                                    style={{
                                      width: '100%',
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                      fontWeight: '500',
                                      fontFamily: 'var(--font-system)',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      borderRadius: '6px',
                                      color: '#885050',
                                      cursor: 'pointer',
                                      opacity: 0.7,
                                      marginTop: '4px',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'var(--bg-glass)';
                                      e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.opacity = '0.7';
                                    }}
                                  >
                                    + Create canvas
                                  </button>
                                </div>
                              )}
                              
                              {/* Create New Canvas Button for Empty Folders */}
                              {folderCanvases.length === 0 && (
                                <div style={{ padding: '8px' }}>
                                  <button
                                    onClick={() => handleCreateCanvasInFolder(folder.id)}
                                    style={{
                                      width: '100%',
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                      fontWeight: '500',
                                      fontFamily: 'var(--font-system)',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      borderRadius: '6px',
                                      color: '#885050',
                                      cursor: 'pointer',
                                      opacity: 0.7,
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'var(--bg-glass)';
                                      e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.opacity = '0.7';
                                    }}
                                  >
                                    + Create canvas
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {/* Separator */}
                    <div style={{
                      height: '1px',
                      backgroundColor: 'var(--color-divider)',
                      margin: '8px 0',
                      opacity: 0.3,
                    }} />
                  </>
                )}

                {/* Canvases Section (Top-level) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#885050',
                    fontFamily: 'var(--font-system)',
                  }}>
                    Canvases
                  </span>
                  <button
                    onClick={handleCreateCanvasAtRoot}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#885050',
                      opacity: 0.7,
                          fontSize: '12px',
                      fontFamily: 'var(--font-system)',
                    }}
                    title="Create new canvas"
                  >
                    ＋
                  </button>
                </div>

                {/* Top-level Canvases */}
                {(() => {
                  const topLevelCanvases = canvases.filter(canvas => !canvas.folderId);
                  
                  return topLevelCanvases
                    .sort((a, b) => {
                      // Sort by creation date (newest first) instead of title to maintain consistent order
                      const aDate = new Date(a.createdAt || 0);
                      const bDate = new Date(b.createdAt || 0);
                      return bDate.getTime() - aDate.getTime();
                    })
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
                            padding: '8px 10px',
                            fontSize: '11px',
                            fontWeight: '500',
                            fontFamily: 'var(--font-system)',
                            borderRadius: '6px',
                            border: 'none',
                            marginBottom: '4px',
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
                          onClick={() => {
                            if (!isEditing) {
                              handleSwitchCanvas(canvas.id);
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
                          {currentCanvasId === canvas.id && !isEditing && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCanvas(canvas.id);
                              }}
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                color: '#885050',
                                opacity: 0.5,
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                marginLeft: '4px',
                              }}
                              title="Canvas options"
                            >
                              <MoreVertical size={12} style={{ opacity: 0.5 }} />
                            </div>
                          )}
                        </div>
                      );
                    });
                })()}
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