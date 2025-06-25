# Current Development Tasks

> **Active Phase**: Phase 1 - Canvas State Management  
> **Current Task**: CANVAS-001  
> **Sprint Goal**: Implement local canvas persistence

## 🎯 Phase 1 Tasks (In Order)

### ✅ CANVAS-001: Canvas State Serialization/Deserialization
**Status**: 🔄 IN PROGRESS  
**Assignee**: AI Agent  
**Files**: `src/hooks/useCanvasState.ts`

**Implementation Steps**:
1. Create `useCanvasState` hook with TypeScript types
2. Implement `serializeCanvas()` function using `editor.store.getSnapshot()`
3. Implement `deserializeCanvas()` function to restore state
4. Add error handling for corrupted JSON data
5. Add loading states and error states
6. Test with existing yoga pose canvas

**Code Requirements**:
```typescript
// Expected hook interface
const {
  serializeCanvas,
  deserializeCanvas,
  isLoading,
  error
} = useCanvasState(editor);
```

**Acceptance Criteria**:
- [ ] Hook successfully serializes current canvas to JSON
- [ ] Hook can restore canvas from serialized JSON
- [ ] All yoga poses maintain positions and properties
- [ ] Proper TypeScript types for all state
- [ ] Error handling for edge cases
- [ ] Loading states during operations

---

### ⭕ CANVAS-002: localStorage Persistence with Auto-save
**Status**: 🔜 NEXT  
**Files**: `src/hooks/useAutoSave.ts`

**Dependencies**: CANVAS-001 must be complete

**Quick Overview**:
- Build on `useCanvasState` hook
- Add debounced auto-save (2 seconds)
- Implement Ctrl+S manual save
- Add save status indicators

---

### ⭕ CANVAS-003: Canvas State Management
**Status**: 🔜 UPCOMING  
**Files**: `src/hooks/useCanvasManager.ts`

---

### ⭕ CANVAS-004: Error Handling
**Status**: 🔜 UPCOMING  
**Files**: `src/components/ErrorBoundary.tsx`

## 🚀 Quick Start for AI Agent

To begin CANVAS-001:

1. **Read the current codebase structure**:
   - Understand how tldraw editor is currently set up in `src/components/FlowPlanner.tsx`
   - Review yoga pose creation in `src/utils/svg-pose-parser.ts`

2. **Create the hook file**:
   - File: `src/hooks/useCanvasState.ts`
   - Import necessary tldraw types and hooks

3. **Implement core functions**:
   - `serializeCanvas()` - use `editor.store.getSnapshot()`
   - `deserializeCanvas()` - use `editor.store.loadSnapshot()`

4. **Test the implementation**:
   - Create a test component to verify serialization works
   - Ensure yoga poses are preserved correctly

5. **Update this file when complete**:
   - Mark CANVAS-001 as ✅ complete
   - Move to CANVAS-002
   - Update progress status

## 📋 Context for AI Agents

**Current Project State**:
- ✅ Basic yoga flow planner working with tldraw
- ✅ Custom yoga pose shapes implemented  
- ✅ Pose placement with automatic spacing
- ✅ GitHub repository set up
- ✅ Vercel deployment working
- 🔄 Working on canvas state management

**Key Files to Understand**:
- `src/components/FlowPlanner.tsx` - Main tldraw integration
- `src/utils/svg-pose-parser.ts` - Yoga pose creation logic
- `src/shapes/` - Custom shape definitions

**Don't Change These (Working Features)**:
- Yoga pose placement and styling
- Custom toolbar and pose panel
- Font rendering (draw font)
- SVG asset loading