import { StateNode } from 'tldraw';
import type { TLEventHandlers } from 'tldraw';

export class YogaPoseTool extends StateNode {
  static override id = 'yoga-pose-tool';
  
  override onEnter = () => {
    this.editor.setCursor({ type: 'default', rotation: 0 });
  };

  override onPointerDown: TLEventHandlers['onPointerDown'] = () => {
    // Switch to select tool when clicking on canvas
    this.editor.setCurrentTool('select');
  };

  override onExit = () => {
    // Clean up the temporary shape when exiting the tool
    if (this.tempShapeId) {
      this.editor.deleteShape(this.tempShapeId);
      this.tempShapeId = null;
    }
  };

  override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
    // Keep the tool active while moving
  };

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    // Keep the tool active
  };
}