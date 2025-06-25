import { createShapeId, type TLShape, type Editor } from 'tldraw';

export interface YogaPoseSVG {
  id: string;
  name: string;
  indianName: string;
  svg: string;
  thumbnail: string;
}

export async function createPoseFromSVG(
  editor: Editor,
  poseData: YogaPoseSVG, 
  targetX: number, 
  targetY: number
): Promise<void> {
  // Create SVG shape using our custom shape utility
  const svgShapeId = createShapeId();
  
  // Modify the SVG to remove fixed dimensions, make it scalable, and use theme-aware colors
  const modifiedSvg = poseData.svg
    .replace(/width="[^"]*"/g, '')
    .replace(/height="[^"]*"/g, '')
    .replace(/stroke="[^"]*"/g, 'stroke="var(--color-text)"')
    .replace(/<svg/g, '<svg preserveAspectRatio="xMidYMid meet"');
  
  const svgShape: TLShape = {
    id: svgShapeId,
    type: 'yoga-pose-svg',
    x: targetX,
    y: targetY,
    rotation: 0,
    index: 'a0' as any,
    parentId: 'page:page' as any,
    typeName: 'shape',
    isLocked: false,
    opacity: 1,
    meta: {},
    props: {
      svg: modifiedSvg,
      w: 250,
      h: 250,
    },
  };
  
  editor.createShape(svgShape);
  
  // Create title text using putExternalContent but then update with draw font
  await editor.putExternalContent({
    type: 'text',
    text: poseData.name,
    point: { x: targetX + 125, y: targetY + 265 },
    sources: [
      { type: 'text', subtype: 'text', data: poseData.name } as const
    ]
  });
  
  // Create Indian name text using putExternalContent
  await editor.putExternalContent({
    type: 'text',
    text: poseData.indianName,
    point: { x: targetX + 125, y: targetY + 295 },
    sources: [
      { type: 'text', subtype: 'text', data: poseData.indianName } as const
    ]
  });
  
  // Update the created text shapes to use draw font and proper styling, then group all three shapes
  setTimeout(() => {
    const allShapes = editor.getCurrentPageShapes();
    
    // Get the most recently created shapes (last 3: SVG + 2 text shapes)
    const recentShapes = allShapes
      .sort((a, b) => {
        // Sort by creation time (index) to get most recent
        return b.index.localeCompare(a.index);
      })
      .slice(0, 3); // Take the 3 most recent shapes
    
    // Separate text shapes and update their styling
    const textShapes = recentShapes
      .filter(shape => shape.type === 'text')
      .sort((a, b) => a.y - b.y); // Sort by Y position (top to bottom)
    
    textShapes.forEach((shape, index) => {
      if (index === 0) {
        // Title text (higher Y position)
        editor.updateShape({
          id: shape.id,
          type: 'text',
          props: {
            ...shape.props,
            font: 'draw',
            size: 'l',
            color: 'black',
          },
        });
      } else if (index === 1) {
        // Subtitle text (lower Y position - Indian name)
        editor.updateShape({
          id: shape.id,
          type: 'text',
          props: {
            ...shape.props,
            font: 'draw',
            size: 'm',
            color: 'grey',
          },
        });
      }
    });
    
    // Group all three shapes (SVG + title + subtitle)
    const shapeIds = recentShapes.map(shape => shape.id);
    
    if (shapeIds.length === 3) {
      try {
        // Use batch operation to ensure atomic grouping
        editor.batch(() => {
          const existingShapes = shapeIds.filter(id => editor.getShape(id));
          
          if (existingShapes.length === 3) {
            // Select and group in one batch operation
            editor.setSelectedShapes(existingShapes);
            editor.groupShapes(existingShapes);
          }
        });
      } catch (error) {
        console.error('Error grouping shapes:', error);
      }
    }
  }, 50); // Increased timeout to ensure shapes are fully created
  
}

// Keep the old function for backward compatibility but mark as deprecated
export function parseSVGToShapes(poseData: YogaPoseSVG, targetX: number, targetY: number): TLShape[] {
  console.warn('parseSVGToShapes is deprecated. Use createPoseFromSVG instead.');
  
  const shapes: TLShape[] = [];
  
  // Create a transparent rectangle frame to contain everything
  const frameId = createShapeId();
  const frameShape: TLShape = {
    id: frameId,
    type: 'geo',
    x: targetX,
    y: targetY,
    rotation: 0,
    index: 'a0' as any,
    parentId: 'page:page' as any,
    typeName: 'shape',
    isLocked: false,
    opacity: 1,
    meta: {},
    props: {
      w: 352,
      h: 320, // SVG height (255) + text space (65)
      geo: 'rectangle',
      fill: 'none',
      color: 'black',
      dash: 'solid',
      size: 's',
    },
  };
  shapes.push(frameShape);
  
  // Create title text underneath the SVG
  const titleId = createShapeId();
  const titleShape: TLShape = {
    id: titleId,
    type: 'text',
    x: targetX + 10,
    y: targetY + 265,
    rotation: 0,
    index: 'a0' as any,
    parentId: frameId as any,
    typeName: 'shape',
    isLocked: false,
    opacity: 1,
    meta: {},
    props: {
      color: 'black',
      font: 'draw',
      size: 'l',
      text: poseData.name,
    },
  };
  shapes.push(titleShape);
  
  // Create Indian name text underneath the title
  const indianNameId = createShapeId();
  const indianNameShape: TLShape = {
    id: indianNameId,
    type: 'text',
    x: targetX + 10,
    y: targetY + 295,
    rotation: 0,
    index: 'a0' as any,
    parentId: frameId as any,
    typeName: 'shape',
    isLocked: false,
    opacity: 0.6,
    meta: {},
    props: {
      color: 'grey',
      font: 'draw',
      size: 'm',
      text: poseData.indianName,
    },
  };
  shapes.push(indianNameShape);
  
  return shapes;
} 