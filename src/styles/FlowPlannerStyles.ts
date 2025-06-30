// Style definitions for FlowPlanner components
export const flowPlannerStyles = `
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
`;

// Sidebar styles
export const sidebarStyles = {
  sidebar: (sidebarVisible: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    width: sidebarVisible ? '216px' : '0px',
    minWidth: sidebarVisible ? '216px' : '0px',
    height: 'auto',
    padding: sidebarVisible ? '40px 0px 40px 0px' : '0',
    backgroundColor: 'transparent',
    opacity: sidebarVisible ? 1 : 0,
    pointerEvents: sidebarVisible ? 'auto' as const : 'none' as const,
    overflow: 'visible' as const,
  }),
  
  header: {
    width: 'calc(100% - 16px)',
    flexShrink: 0,
    marginLeft: '8px',
    marginRight: '8px',
  },
  
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    marginBottom: '4px',
  },
  
  headerTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#885050',
    fontFamily: 'var(--font-system)',
  },
  
  addButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#885050',
    opacity: 0.7,
    fontSize: '10px',
    fontFamily: 'var(--font-system)',
    padding: '2px 4px',
  },
  
  scrollableContent: {
    flex: 1,
    width: '100%',
    marginBottom: '8px',
    minHeight: 0,
    overflowY: 'hidden' as const,
    overflowX: 'visible' as const,
  },
  
  footer: {
    padding: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  
  footerButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '6px',
    color: '#885050',
    fontSize: '11px',
    cursor: 'pointer',
  },
  
  accountSection: {
    padding: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  
  accountButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '6px',
    color: '#885050',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  accountMenu: {
    marginTop: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    padding: '4px',
  },
  
  accountMenuButton: {
    width: '100%',
    padding: '6px',
    background: 'transparent',
    border: 'none',
    color: '#885050',
    fontSize: '10px',
    cursor: 'pointer',
    borderRadius: '4px',
  },
};

// Canvas styles
export const canvasStyles = {
  canvas: (sidebarVisible: boolean) => ({
    flex: '1',
    backgroundColor: 'hsla(39, 88%, 97%, 1)',
    borderRadius: '12px',
    overflow: 'hidden' as const,
    margin: sidebarVisible ? '40px 40px 40px 0px' : '0px',
  }),
  
  ghostButton: (sidebarVisible: boolean) => ({
    position: 'absolute' as const,
    top: sidebarVisible ? '48px' : '48px',
    left: sidebarVisible ? '212px' : '40px',
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    zIndex: 9999,
    borderRadius: '4px',
  }),
}; 