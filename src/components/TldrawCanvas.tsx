import React from 'react';
import {
  Tldraw,
  type TLComponents,
  type TLUiAssetUrlOverrides,
  type TLUiOverrides,
  type Editor,
  useTools,
  useIsToolSelected,
  useEditor,
  DefaultToolbar,
  DefaultToolbarContent,
} from 'tldraw';
import 'tldraw/tldraw.css';
import { YogaPoseShapeUtil, YogaPoseTool, YogaPoseSvgShapeUtil } from '../shapes';
import { CustomGrid } from './CustomGrid';
import { CustomPageMenu } from './CustomPageMenu';
import { YogaPosePanel } from './YogaPosePanel';
import { getPoseState } from '../utils/pose-state';
import { yogaCategories } from '../assets/yoga-flows';
import { useAuthContext } from './AuthProvider';

// Custom tools and shape utilities
const customTools = [YogaPoseTool];
const customShapeUtils = [YogaPoseShapeUtil, YogaPoseSvgShapeUtil];

// Custom asset URLs for the yoga pose tool icon
const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    'yoga-icon': '/yoga-pose-icon.svg',
  },
};

// UI overrides for tldraw - limit tools and add yoga pose tool
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Only keep the tools we want
    const allowedTools: any = {
      select: tools.select,
      text: tools.text,
      eraser: tools.eraser,
      yogaPose: {
        id: 'yoga-pose-tool',
        icon: 'yoga-icon',
        label: 'Yoga Pose',
        kbd: 'y',
        onSelect: () => {
          editor.setCurrentTool('yoga-pose-tool');
        },
      }
    };
    
    // Add other tools only if they exist
    if (tools.frame) allowedTools.frame = tools.frame;
    if (tools.media) allowedTools.media = tools.media;
    if (tools.asset) allowedTools.asset = tools.asset;
    if (tools.draw) allowedTools.draw = tools.draw;
    if (tools.note) allowedTools.note = tools.note;
    
    return allowedTools;
  },
  actions(editor, actions) {
    return {
      ...actions,
      'toggle-quick-styles': {
        id: 'toggle-quick-styles',
        label: 'Toggle Quick Styles',
        kbd: '$mod+shift+s',
        onSelect: () => {
          editor.setCurrentTool('select');
        },
      },
    };
  },
};

// Create components with sidebar visibility and custom toolbar
const createComponents = (sidebarVisible: boolean, isAnimating: boolean): TLComponents => ({
  PageMenu: () => <CustomPageMenu sidebarVisible={sidebarVisible} />,
  Grid: CustomGrid,
  MainMenu: null,
  // Keep toolbar visible throughout animation
  Toolbar: (props) => {
    const tools = useTools();
    const editor = useEditor();
    const isYogaPoseSelected = useIsToolSelected(tools['yogaPose']);
    const [activeCategory, setActiveCategory] = React.useState<number>(0);
    const [isHoveringPoseTool, setIsHoveringPoseTool] = React.useState(false);
    const { user: _user } = useAuthContext();
    
    return (
      <>
        {/* Floating YogaPosePanel above the toolbar */}
        {isYogaPoseSelected && (
          <div 
            className="tlui-panel"
            style={{
              position: 'fixed',
              bottom: '64px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '440px',
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
          bottom: '0px',
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
                onMouseEnter={() => setIsHoveringPoseTool(true)}
                onMouseLeave={() => setIsHoveringPoseTool(false)}
                onClick={() => {
                  if (isYogaPoseSelected) {
                    editor.setCurrentTool('select');
                  } else {
                    editor.setCurrentTool('yoga-pose-tool');
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
    );
  },
});

export interface TldrawCanvasProps {
  sidebarVisible: boolean;
  onMount: (editor: Editor) => void;
  isAnimating?: boolean; // Add animation state prop
}

export const TldrawCanvas: React.FC<TldrawCanvasProps> = ({
  sidebarVisible,
  onMount,
  isAnimating = false, // Default to false
}) => {
  const components = React.useMemo(() => createComponents(sidebarVisible, isAnimating), [sidebarVisible, isAnimating]);

  return (
    <Tldraw
      tools={customTools}
      shapeUtils={customShapeUtils}
      overrides={uiOverrides}
      components={components}
      assetUrls={customAssetUrls}
      onMount={onMount}
    />
  );
}; 