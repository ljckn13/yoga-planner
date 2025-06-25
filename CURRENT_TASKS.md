# Current Development Tasks

> **Active Phase**: Phase 2 - Multi-Canvas UI  
> **Current Task**: UI-001  
> **Sprint Goal**: Build sidebar with canvas management

## 🎯 Phase 1 Tasks (In Order)

### ✅ CANVAS-001: Canvas State Serialization/Deserialization
**Status**: ✅ COMPLETE  
**Assignee**: AI Agent  
**Files**: `src/hooks/useCanvasState.ts`

**Implementation Steps**:
1. ✅ Create `useCanvasState` hook with TypeScript types
2. ✅ Implement `serializeCanvas()` function using `editor.store.getSnapshot()`
3. ✅ Implement `deserializeCanvas()` function to restore state
4. ✅ Add error handling for corrupted JSON data
5. ✅ Add loading states and error states
6. ✅ Test with existing yoga pose canvas

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
- ✅ Hook successfully serializes current canvas to JSON
- ✅ Hook can restore canvas from serialized JSON
- ✅ All yoga poses maintain positions and properties
- ✅ Proper TypeScript types for all state
- ✅ Error handling for edge cases
- ✅ Loading states during operations

---

### ✅ CANVAS-002: localStorage Persistence with Auto-save
**Status**: ✅ COMPLETE  
**Assignee**: AI Agent  
**Files**: `src/hooks/useAutoSave.ts`

**Dependencies**: CANVAS-001 ✅ complete

**Implementation Steps**:
1. ✅ Create `useAutoSave` hook that builds on `useCanvasState`
2. ✅ Implement debounced auto-save (instant save - 0ms delay)
3. ✅ Implement Ctrl+S manual save
4. ✅ Add save status indicators
5. ✅ Handle localStorage quota exceeded errors
6. ✅ Test auto-save functionality

**Code Requirements**:
```typescript
// Expected hook interface
const {
  autoSave,
  manualSave,
  saveStatus,
  lastSaved,
  hasUnsavedChanges
} = useAutoSave(editor, canvasId);
```

**Acceptance Criteria**:
- ✅ Canvas automatically saves instantly after changes
- ✅ Manual save works with Ctrl+S
- ✅ Multiple canvases stored separately
- ✅ Visual indicator shows save status
- ✅ Handles localStorage errors gracefully

---

### ✅ CANVAS-003: Canvas State Management
**Status**: ✅ COMPLETE  
**Assignee**: AI Agent  
**Files**: `src/hooks/useCanvasManager.ts`, `src/components/FlowPlanner.tsx`

**Dependencies**: CANVAS-002 ✅ complete

**Implementation Steps**:
1. ✅ Create `useCanvasManager` hook for managing multiple canvases
2. ✅ Implement CRUD operations: create, read, update, delete canvases
3. ✅ Add canvas metadata (id, title, lastModified, thumbnail)
4. ✅ Create default canvas creation logic
5. ✅ Add canvas switching with proper state management
6. ✅ Implement single-page-per-canvas model
7. ✅ Create custom page menu showing canvas title
8. ✅ Add canvas management UI in main menu

**Code Requirements**:
```typescript
// Expected hook interface
const {
  canvases,
  currentCanvas,
  createCanvas,
  updateCanvas,
  deleteCanvas,
  switchCanvas,
  isLoading
} = useCanvasManager();
```

**Acceptance Criteria**:
- ✅ Can create new blank canvas
- ✅ Can rename canvas titles
- ✅ Can delete canvases with confirmation
- ✅ Canvas switching preserves state properly
- ✅ Single page per canvas enforced
- ✅ Canvas title displayed in page menu
- ✅ Proper state management when switching canvases

---

### ⏸️ CANVAS-004: Error Handling
**Status**: ⏸️ DEFERRED  
**Files**: `src/components/ErrorBoundary.tsx`

**Dependencies**: CANVAS-003 ✅ complete

**Note**: Error handling will be addressed later in Phase 4 (Polish & Production) when we focus on production-ready features. For now, the basic error handling in the existing hooks is sufficient for development.

**Implementation Steps** (for future reference):
1. Create React error boundary around canvas area
2. Implement graceful handling of localStorage quota exceeded
3. Add recovery options for corrupted canvas data
4. Create user-friendly error messages
5. Add error logging for debugging

**Code Requirements**:
```typescript
// Expected error boundary interface
<ErrorBoundary fallback={<ErrorFallback />}>
  <FlowPlanner />
</ErrorBoundary>
```

**Acceptance Criteria**:
- [ ] App doesn't crash on canvas errors
- [ ] Clear error messages for users
- [ ] Recovery options provided
- [ ] Errors logged for debugging
- [ ] Graceful handling of localStorage issues

---

## 🎯 Phase 2 Tasks (In Order)

### 🔄 UI-001: Create Workspace Layout
**Status**: 🔄 IN PROGRESS  
**Files**: `src/components/WorkspaceLayout.tsx`, `src/components/FlowPlanner.tsx`

**Dependencies**: CANVAS-003 ✅ complete

**Implementation Steps**:
1. ✅ Toolbar and yoga pose tool functionality restored and working
2. ✅ Canvas title display in page menu with proper system font
3. ✅ tldraw native UI font styling applied (navigation panel, menus, buttons, etc.)
4. Create workspace layout component with sidebar and canvas area
5. Implement responsive design for different screen sizes
6. Add sidebar toggle functionality
7. Integrate existing FlowPlanner into the layout
8. Ensure proper canvas area sizing

**Code Requirements**:
```typescript
// Expected workspace layout interface
<WorkspaceLayout>
  <Sidebar />
  <CanvasArea>
    <FlowPlanner />
  </CanvasArea>
</WorkspaceLayout>
```

**Acceptance Criteria**:
- [ ] Sidebar and canvas area layout works
- [ ] Responsive design for mobile/desktop
- [ ] Sidebar can be toggled on/off
- [ ] Canvas area properly sized
- [ ] Existing FlowPlanner functionality preserved

---

## 🚀 Quick Start for AI Agent

To begin UI-001:

1. **Review the completed CANVAS-003**:
   - Understand the `useCanvasManager` hook in `src/hooks/useCanvasManager.ts`
   - Review the canvas management UI in `src/components/FlowPlanner.tsx`

2. **Create the workspace layout component**:
   - File: `src/components/WorkspaceLayout.tsx`
   - Implement responsive layout with sidebar and canvas area

3. **Implement core functionality**:
   - Sidebar toggle functionality
   - Responsive design
   - Proper canvas area sizing

4. **Test the implementation**:
   - Verify layout works on different screen sizes
   - Test sidebar toggle functionality
   - Ensure canvas functionality is preserved

5. **Update this file when complete**:
   - Mark UI-001 as ✅ complete
   - Move to UI-002
   - Update progress status

## 📋 Context for AI Agents

**Current Project State**:
- ✅ Basic yoga flow planner working with tldraw
- ✅ Custom yoga pose shapes implemented  
- ✅ Pose placement with automatic spacing
- ✅ GitHub repository set up
- ✅ Vercel deployment working
- ✅ Canvas state serialization/deserialization implemented
- ✅ localStorage persistence and auto-save implemented
- ✅ Multi-canvas management implemented
- 🔄 Moving to Phase 2: Multi-Canvas UI

**Key Files to Understand**:
- `src/components/FlowPlanner.tsx` - Main tldraw integration with canvas management
- `src/utils/svg-pose-parser.ts` - Yoga pose creation logic
- `src/hooks/useCanvasState.ts` - Canvas state serialization (✅ complete)
- `src/hooks/useAutoSave.ts` - Auto-save functionality (✅ complete)
- `src/hooks/useCanvasManager.ts` - Multi-canvas management (✅ complete)
- `src/shapes/` - Custom shape definitions

**Don't Change These (Working Features)**:
- Yoga pose placement and styling
- Custom toolbar and pose panel
- Font rendering (draw font)
- SVG asset loading
- Canvas state serialization (✅ complete)
- Auto-save functionality (✅ complete)
- Multi-canvas management (✅ complete)