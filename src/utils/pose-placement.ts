import { Editor, createShapeId } from 'tldraw';
import type { YogaPoseShape } from '../shapes/yoga-pose-shape';
import { yogaPoses } from '../assets/yoga-flows';

let poseCounter = 0;

export const placePoseOnCanvas = (editor: Editor, pose: typeof yogaPoses[0]) => {
  const shapeId = createShapeId();
  
  // Calculate position with 40px horizontal spacing
  const baseX = 100; // Starting position from left
  const baseY = 100; // Fixed Y position
  const spacing = 120; // 80px pose width + 40px gap
  const x = baseX + (poseCounter * spacing);
  
  const yogaPoseShape: YogaPoseShape = {
    id: shapeId,
    type: 'yoga-pose',
    x: x,
    y: baseY,
    rotation: 0,
    index: editor.getHighestIndexForParent(editor.getCurrentPageId()),
    parentId: editor.getCurrentPageId(),
    typeName: 'shape',
    isLocked: false,
    opacity: 1,
    meta: {},
    props: {
      w: 80,
      h: 80,
      poseId: pose.id,
      name: pose.name,
      translation: pose.translation,
      category: pose.category,
      subCategory: pose.subCategory,
      svgPath: pose.image,
    },
  };
  
  editor.createShape(yogaPoseShape);
  poseCounter++;
  
  // Reset counter after 10 poses to prevent going off screen
  if (poseCounter >= 10) {
    poseCounter = 0;
  }
};