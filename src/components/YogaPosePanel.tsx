import React, { useState, useEffect } from 'react';
import { useEditor } from 'tldraw';
import { yogaPoses, yogaCategories } from '../assets/yoga-flows';
import { sampleSVGPoses } from '../assets/sample-svg-poses';
import { SubCategory } from '../types/category';
import { createPoseFromSVG, type YogaPoseSVG } from '../utils/svg-pose-parser';

interface YogaPosePanelProps {
  onPoseSelect: (pose: typeof yogaPoses[0] | YogaPoseSVG) => void;
  selectedPose?: typeof yogaPoses[0] | YogaPoseSVG;
  activeCategory: number;
  onCategoryChange: (category: number) => void;
}

export const YogaPosePanel: React.FC<YogaPosePanelProps> = ({ onPoseSelect, selectedPose, activeCategory }) => {
  const editor = useEditor();
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory | undefined>();
  const [lastPosePosition, setLastPosePosition] = useState<{ x: number; y: number } | null>(null);

  // Auto-select first subcategory when category changes
  useEffect(() => {
    const currentCategory = yogaCategories.find(cat => cat.category === activeCategory);
    if (currentCategory?.subCategories && currentCategory.subCategories.length > 0) {
      setActiveSubCategory(currentCategory.subCategories[0].subCategory);
    } else {
      setActiveSubCategory(undefined);
    }
  }, [activeCategory]);

  // For now, let's use the sample SVG poses for testing
  const availablePoses = sampleSVGPoses;
  
  const filteredPoses = availablePoses.filter(() => {
    // For now, show all SVG poses regardless of category
    return true;
  });

  const currentCategory = yogaCategories.find(cat => cat.category === activeCategory);
  const hasSubCategories = currentCategory?.subCategories && currentCategory.subCategories.length > 0;

  // Calculate height based on number of poses
  const calculateGridHeight = () => {
    if (filteredPoses.length === 0) return 80; // Empty state height
    const rows = Math.ceil(filteredPoses.length / 4); // 4 poses per row
    return Math.min(rows * 80, 300); // 80px per row, max 300px
  };

  return (
    <div 
      className="yoga-pose-panel" 
                style={{ 
        display: 'flex', 
        flexDirection: 'column',
        maxHeight: '300px',
        margin: '0',
        padding: '4px',
        gap: '0px',
        backgroundColor: 'var(--color-panel)',
        borderRadius: '12px',
        overflow: 'hidden'

      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <style>
        {`
          .yoga-pose-panel *:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          .yoga-pose-panel *:focus-visible {
            outline: none !important;
            box-shadow: none !important;
          }
          .yoga-pose-panel *:focus-within {
            outline: none !important;
            box-shadow: none !important;
          }
          .yoga-pose-panel * {
            border-color: var(--color-panel-contrast) !important;
          }
          .yoga-pose-panel *[data-selected="true"] {
            border-color: var(--color-panel-contrast) !important;
          }
          .yoga-pose-panel *[data-state="selected"] {
            border-color: var(--color-panel-contrast) !important;
          }
          .yoga-pose-panel *[aria-selected="true"] {
            border-color: var(--color-panel-contrast) !important;
          }
          .yoga-pose-panel *[class*="selected"] {
            border-color: var(--color-panel-contrast) !important;
          }
          .yoga-pose-panel *[class*="active"] {
            border-color: var(--color-panel-contrast) !important;
          }
        `}
      </style>
      {/* Subcategories - Horizontal if available (TOP) */}
      {activeCategory && hasSubCategories && (
        <div style={{ flexShrink: 0 }}>
          <div style={{ overflowX: 'auto', padding: '0' }}>
            <div style={{ 
              display: 'flex', 
              gap: '4px', 
              justifyContent: 'flex-start',
              width: '100%',
              padding: '4px'
            }}>
              {currentCategory.subCategories.map((subCat) => (
                <button
                  key={subCat.subCategory}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubCategory(subCat.subCategory);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => {
                    if (activeSubCategory !== subCat.subCategory) {
                      e.currentTarget.style.backgroundColor = 'hsl(0 0% 96.1%)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSubCategory !== subCat.subCategory) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  style={{ 
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                    padding: '6px 12px',
                    backgroundColor: activeSubCategory === subCat.subCategory ? 'hsl(0 0% 94%)' : 'transparent',
                    color: 'var(--color-text)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  {subCat.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {activeCategory && filteredPoses.length === 0 && (
        <div style={{ flexShrink: 0 }}>
          <div style={{ 
            padding: '16px', 
            textAlign: 'center', 
            color: 'var(--color-text-3)',
            fontSize: '12px'
          }}>
            {hasSubCategories && !activeSubCategory 
              ? 'Select a subcategory to view poses'
              : 'No poses found in this category'
            }
          </div>
        </div>
      )}

      {/* Poses Grid (BOTTOM) */}
      {filteredPoses.length > 0 && (
        <div style={{ 
          flexShrink: 0,
          height: `${calculateGridHeight()}px`
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            height: '100%',
            overflowY: 'auto',
            justifyContent: 'start'
          }}>
            {filteredPoses.map((pose) => (
              <div
                key={pose.id}
                style={{
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minHeight: '70px',
                  backgroundColor: selectedPose?.id === pose.id ? 'hsl(0 0% 94%)' : 'var(--color-panel)',
                  border: `1px solid ${selectedPose?.id === pose.id ? 'var(--color-text)' : 'var(--color-panel-contrast)'}`,
                  borderRadius: '12px',
                  transition: 'all 0.1s ease',
                  outline: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                onClick={async () => {
                  onPoseSelect(pose);
                  
                  // Create SVG-based shapes on the canvas
                  let x, y;
                  if (lastPosePosition === null) {
                    // First pose: place at center
                    const center = editor.getViewportScreenCenter();
                    const point = editor.screenToPage(center);
                    x = point.x - 200; // Half of the frame width
                    y = point.y - 250; // Half of the frame height
                  } else {
                    // Place 40px to the right of the last pose
                    x = lastPosePosition.x + 440; // 400px width + 40px gap
                    y = lastPosePosition.y;
                  }
                  
                  // Update the last pose position
                  setLastPosePosition({ x, y });
                  
                  // Create pose using the new async function
                  await createPoseFromSVG(editor, pose, x, y);
                  
                  // Clear the selected pose after pasting
                  onPoseSelect(undefined as any);
                }}
                onMouseEnter={(e) => {
                  if (selectedPose?.id !== pose.id) {
                    e.currentTarget.style.backgroundColor = 'hsl(0 0% 96.1%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPose?.id !== pose.id) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel)';
                  }
                }}
              >
                <img 
                  src={pose.thumbnail} 
                  alt={pose.name}
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    objectFit: 'contain',
                    marginBottom: '4px'
                  }}
                />
                <div style={{ 
                  fontSize: '9px', 
                  textAlign: 'center', 
                  lineHeight: '1.1',
                  color: 'var(--color-text)',
                  overflow: 'hidden',
                  marginTop: 'auto'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '1px' }}>{pose.name}</div>
                  <div style={{ opacity: 0.6, fontSize: '8px' }}>{pose.indianName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};