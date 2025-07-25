import React from 'react';
import { useCurrentCanvasTitle } from '../hooks/useCurrentCanvasTitle';
import { CustomMainMenu } from './CustomMainMenu';

// Custom page menu that shows canvas title and main menu side by side
export const CustomPageMenu: React.FC = () => {
  const canvasTitle = useCurrentCanvasTitle();
  
  return (
    <div className="tlui-page-menu" style={{ 
      zIndex: 1000, 
      pointerEvents: 'auto', 
      position: 'relative' 
    }}>
      <div className="tlui-page-menu__header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        zIndex: 1000,
        pointerEvents: 'auto',
        position: 'relative'
      }}>

        <div 
          className="tlui-page-menu__header__title tlui-text text-primary-bold w-30 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ width: '120px' }}
        >
          {canvasTitle}
        </div>
        {/* Main menu to the right of the title */}
        <CustomMainMenu />
      </div>
    </div>
  );
}; 