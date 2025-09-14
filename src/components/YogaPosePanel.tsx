import React, { useState, useEffect } from 'react';
import { useEditor } from 'tldraw';
import { yogaPoses, yogaCategories } from '../assets/yoga-flows';
import { SubCategory } from '../types/category';
import { createPoseFromSVG } from '../utils/svg-pose-parser';

interface YogaPosePanelProps {
  onPoseSelect: (pose: typeof yogaPoses[0]) => void;
  selectedPose?: typeof yogaPoses[0] | import('../utils/svg-pose-parser').YogaPoseSVG;
  activeCategory: number;
  onCategoryChange: (category: number) => void;
}

export const YogaPosePanel: React.FC<YogaPosePanelProps> = ({ onPoseSelect, selectedPose, activeCategory }) => {
  const editor = useEditor();
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory | undefined>();
  const [lastPosePosition, setLastPosePosition] = useState<{ x: number; y: number } | null>(null);

  // Convert yoga pose to SVG format for createPoseFromSVG (inline SVG content for export)
  const convertToSVGFormat = async (pose: typeof yogaPoses[0]) => {
    try {
      const res = await fetch(pose.image);
      const svgText = await res.text();
      
      // Extract viewBox / width / height from the source SVG
      const viewBoxMatch = svgText.match(/viewBox="([^"]+)"/);
      let origW = 100;
      let origH = 100;
      if (viewBoxMatch) {
        const parts = viewBoxMatch[1].split(/\s+/);
        if (parts.length >= 4) {
          origW = parseFloat(parts[2]);
          origH = parseFloat(parts[3]);
        }
      } else {
        const widthMatch = svgText.match(/width="(\d+(?:\.\d+)?)"/);
        const heightMatch = svgText.match(/height="(\d+(?:\.\d+)?)"/);
        if (widthMatch) origW = parseFloat(widthMatch[1]);
        if (heightMatch) origH = parseFloat(heightMatch[1]);
      }
      
      // Normalize to a consistent target frame
      const targetW = 352;
      const targetH = 255;
      const scale = Math.min(targetW / origW, targetH / origH);
      const offsetX = (targetW - origW * scale) / 2;
      const offsetY = (targetH - origH * scale) / 2;
      
      // Extract root <svg> attributes to preserve default fill/stroke from source
      const rootAttrMatch = svgText.match(/<svg\s+([^>]+)>/);
      let preservedAttrs = '';
      if (rootAttrMatch) {
        const raw = rootAttrMatch[1];
        const keep = ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset','color','style'];
        const attrRegex = /(\w[\w-]*)\s*=\s*("[^"]*"|'[^']*')/g;
        let m: RegExpExecArray | null;
        const picked: string[] = [];
        while ((m = attrRegex.exec(raw)) !== null) {
          const key = m[1];
          const val = m[2];
          if (keep.includes(key)) picked.push(`${key}=${val}`);
        }
        preservedAttrs = picked.join(' ');
      }

      // Strip outer <svg> wrapper but keep inner content & defs
      const inner = svgText.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '');
      const wrapped = `\n<svg width="${targetW}" height="${targetH}" viewBox="0 0 ${targetW} ${targetH}" xmlns="http://www.w3.org/2000/svg">\n  <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">\n    <g${preservedAttrs ? ' ' + preservedAttrs : ''}>\n      ${inner}\n    </g>\n  </g>\n</svg>`;
      
      return {
        id: pose.id.toString(),
        name: pose.name,
        indianName: pose.indianName,
        svg: wrapped,
        thumbnail: pose.thumbnail,
      };
    } catch (e) {
      // Fallback to minimal placeholder if fetch fails
      return {
        id: pose.id.toString(),
        name: pose.name,
        indianName: pose.indianName,
        svg: `<svg width="352" height="255" viewBox="0 0 352 255" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">${pose.name}</text></svg>`,
        thumbnail: pose.thumbnail,
      };
    }
  };

  // Auto-select first subcategory when category changes
  useEffect(() => {
    const currentCategory = yogaCategories.find(cat => cat.category === activeCategory);
    if (currentCategory?.subCategories && currentCategory.subCategories.length > 0) {
      setActiveSubCategory(currentCategory.subCategories[0].subCategory);
    } else {
      setActiveSubCategory(undefined);
    }
  }, [activeCategory]);

  // Use the actual yoga poses from yoga-flows.ts
  const availablePoses = yogaPoses;
  
  // Define category and subcategory variables before using them
  const currentCategory = yogaCategories.find(cat => cat.category === activeCategory);
  const hasSubCategories = currentCategory?.subCategories && currentCategory.subCategories.length > 0;
  
  const filteredPoses = availablePoses.filter((pose) => {
    // Filter by category
    if (pose.category !== activeCategory) {
      return false;
    }
    
    // Filter by subcategory if it exists and is selected
    if (hasSubCategories && activeSubCategory !== undefined) {
      return pose.subCategory === activeSubCategory;
    }
    
    return true;
  });

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
                  
                  // Calculate position for the pose
                  let x, y;
                  if (lastPosePosition === null) {
                    // First pose: place at center
                    const center = editor.getViewportScreenCenter();
                    const point = editor.screenToPage(center);
                    x = point.x - 176; // Half of the frame width (352/2)
                    y = point.y - 160; // Half of the frame height (320/2)
                  } else {
                    // Place 40px to the right of the last pose
                    x = lastPosePosition.x + 392; // 352px width + 40px gap
                    y = lastPosePosition.y;
                  }
                  
                  // Update the last pose position
                  setLastPosePosition({ x, y });
                  
                  // Convert pose to SVG format (inline SVG) and create on canvas
                  const svgPose = await convertToSVGFormat(pose);
                  await createPoseFromSVG(editor, svgPose, x, y);
                  
                  // Clear the selected pose after placing
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
                  src={pose.image} 
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
                  <div style={{ opacity: 0.6, fontSize: '8px' }}>{pose.translation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};