import { StateNode } from 'tldraw';
import type { TLEventHandlers } from 'tldraw';

export class YogaPoseTool extends StateNode {
  static override id = 'yoga-pose-tool';
  
  override onEnter = () => {
    this.editor.setCursor({ type: 'default', rotation: 0 });
  };

  override onPointerDown: TLEventHandlers['onPointerDown'] = () => {
    // Switch to select tool for full selection functionality
    this.editor.setCurrentTool('select');
  };
}