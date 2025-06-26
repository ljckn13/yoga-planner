import { createShapeId, type TLShape, type Editor } from 'tldraw';
import { toRichText } from '@tldraw/tlschema';

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
  console.log('🎯 Creating pose from SVG:', {
    poseName: poseData.name,
    targetX,
    targetY,
    originalSvgLength: poseData.svg.length,
    originalSvgPreview: poseData.svg.substring(0, 100) + '...'
  });

  // Get current style state from selected shapes or editor state
  let currentColor = 'black';
  let currentFill = 'none';
  let currentOpacity = 1;

  // First try to get style from selected shapes
  const selectedShapes = editor.getSelectedShapes();
  console.log('🔍 Selected shapes count:', selectedShapes.length);
  
  if (selectedShapes.length > 0) {
    const firstSelected = selectedShapes[0];
    console.log('🔍 First selected shape:', {
      type: firstSelected.type,
      props: firstSelected.props,
      hasColor: 'color' in firstSelected.props,
      hasFill: 'fill' in firstSelected.props,
      hasOpacity: 'opacity' in firstSelected.props
    });
    
    // Check if the shape has color, fill, and opacity properties
    if ('color' in firstSelected.props && typeof firstSelected.props.color === 'string') {
      currentColor = firstSelected.props.color;
    }
    if ('fill' in firstSelected.props && typeof firstSelected.props.fill === 'string') {
      currentFill = firstSelected.props.fill;
    }
    if ('opacity' in firstSelected.props && typeof firstSelected.props.opacity === 'number') {
      currentOpacity = firstSelected.props.opacity;
    }
    console.log('🎨 Got style from selected shape:', { currentColor, currentFill, currentOpacity });
  } else {
    // Fallback to editor's next shape styles
    const nextStyles = editor.getInstanceState().stylesForNextShape;
    console.log('🔍 Editor next styles:', nextStyles);
    
    if (nextStyles) {
      // Handle nested color property (e.g., {tldraw:color: 'light-green'})
      if (typeof nextStyles === 'object' && nextStyles !== null) {
        // Try to find color in nested properties
        for (const key in nextStyles) {
          if (key.includes('color') && typeof nextStyles[key] === 'string') {
            currentColor = nextStyles[key] as string;
            break;
          }
        }
        
        // Try to find fill in nested properties
        for (const key in nextStyles) {
          if (key.includes('fill') && typeof nextStyles[key] === 'string') {
            currentFill = nextStyles[key] as string;
            break;
          }
        }
        
        // Try to find opacity in nested properties
        for (const key in nextStyles) {
          if (key.includes('opacity') && typeof nextStyles[key] === 'number') {
            currentOpacity = nextStyles[key] as number;
            break;
          }
        }
      }
      
      // Fallback to direct property access
      if (currentColor === 'black') {
        currentColor = (nextStyles.color as string) || 'black';
      }
      if (currentFill === 'none') {
        currentFill = (nextStyles.fill as string) || 'none';
      }
      if (currentOpacity === 1) {
        currentOpacity = (nextStyles.opacity as number) || 1;
      }
    }
    console.log('🎨 Got style from editor state:', { currentColor, currentFill, currentOpacity });
  }

  console.log('🎨 Final style state:', { currentColor, currentFill, currentOpacity });

  // Create SVG shape using our custom shape utility
  const svgShapeId = createShapeId();
  
  // Extract dimensions from the SVG
  const viewBoxMatch = poseData.svg.match(/viewBox="([^"]*)"/);
  let width = 130; // default
  let height = 130; // default
  
  if (viewBoxMatch) {
    const viewBoxParts = viewBoxMatch[1].split(' ');
    if (viewBoxParts.length >= 4) {
      width = parseInt(viewBoxParts[2]);
      height = parseInt(viewBoxParts[3]);
    }
  }
  
  console.log('📏 SVG dimensions:', { width, height });
  
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
      svg: poseData.svg, // Use original SVG directly
      w: width,
      h: height,
      color: currentColor,     // Use current color from style panel
      fill: currentFill,       // Use current fill from style panel
      opacity: currentOpacity, // Use current opacity from style panel
    },
  };
  
  console.log('📝 Created SVG shape:', {
    shapeId: svgShapeId,
    type: svgShape.type,
    position: { x: targetX, y: targetY },
    props: svgShape.props
  });
  
  // Create SVG shape first
  editor.createShape(svgShape);
  console.log('✅ SVG shape created in editor');
  
  // Create text shapes using putExternalContent (safer for sync)
  await editor.putExternalContent({
    type: 'text',
    text: poseData.name,
    point: { x: targetX + (width / 2), y: targetY + height + 15 },
  });
  
  await editor.putExternalContent({
    type: 'text', 
    text: poseData.indianName,
    point: { x: targetX + (width / 2), y: targetY + height + 45 },
  });
  
  console.log('✅ Text shapes created for pose:', poseData.name);
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
      richText: toRichText(poseData.name),
      color: 'black',
      font: 'draw',
      size: 'l',
      textAlign: 'start',
      w: 330,
      scale: 1,
      autoSize: true,
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
      richText: toRichText(poseData.indianName),
      color: 'grey',
      font: 'draw',
      size: 'm',
      textAlign: 'start',
      w: 330,
      scale: 1,
      autoSize: true,
    },
  };
  shapes.push(indianNameShape);
  
  return shapes;
} 