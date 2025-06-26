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
  
  // Create SVG shape first
  editor.createShape(svgShape);
  
  // Create text shapes using putExternalContent (safer for sync)
  await editor.putExternalContent({
    type: 'text',
    text: poseData.name,
    point: { x: targetX + 125, y: targetY + 265 },
  });
  
  await editor.putExternalContent({
    type: 'text', 
    text: poseData.indianName,
    point: { x: targetX + 125, y: targetY + 295 },
  });
  
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