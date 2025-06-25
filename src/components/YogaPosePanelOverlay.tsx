import React from 'react';
import { useTools, useIsToolSelected } from 'tldraw';
import { YogaPosePanel } from './YogaPosePanel';
import { yogaPoses } from '../assets/yoga-flows';
import { getPoseState } from '../utils/pose-state';
import { type YogaPoseSVG } from '../utils/svg-pose-parser';

interface YogaPosePanelOverlayProps {
  onPoseSelect: (pose: typeof yogaPoses[0] | YogaPoseSVG) => void;
}

export const YogaPosePanelOverlay: React.FC<YogaPosePanelOverlayProps> = ({ onPoseSelect }) => {
  const tools = useTools();
  const isYogaPoseSelected = useIsToolSelected(tools['yogaPose']);

  if (!isYogaPoseSelected) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '64px', // Position above the toolbar (toolbar is typically 56px high + 8px gap)
      left: '8px',
      right: '8px',
      height: '300px',
      backgroundColor: 'var(--color-panel)',
      border: '1px solid var(--color-panel-contrast)',
      borderRadius: '8px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    }}>
      <YogaPosePanel 
        onPoseSelect={onPoseSelect}
        selectedPose={getPoseState().selectedPose}
        activeCategory={0}
        onCategoryChange={() => {}}
      />
    </div>
  );
};