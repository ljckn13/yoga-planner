import React from 'react';
import { ArrowUpLeft, ArrowDownRight } from 'lucide-react';
import { useCurrentCanvasTitle } from '../hooks/useCurrentCanvasTitle';
import { CustomMainMenu } from './CustomMainMenu';

// Custom page menu that shows canvas title and main menu side by side
export interface CustomPageMenuProps {
  sidebarVisible: boolean;
}

export const CustomPageMenu: React.FC<CustomPageMenuProps> = ({ sidebarVisible }) => {
  const canvasTitle = useCurrentCanvasTitle();
  
  return (
    <div className="tlui-page-menu">
      <div className="tlui-page-menu__header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Arrow Icon in Canvas UI Main Menu */}
        {sidebarVisible ? (
          <ArrowUpLeft 
            size={18} 
            style={{ cursor: 'pointer' }}
            onClick={() => {
              const event = new CustomEvent('toggleSidebar');
              window.dispatchEvent(event);
            }}
          />
        ) : (
          <ArrowDownRight 
            size={18} 
            style={{ cursor: 'pointer' }}
            onClick={() => {
              const event = new CustomEvent('toggleSidebar');
              window.dispatchEvent(event);
            }}
          />
        )}
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