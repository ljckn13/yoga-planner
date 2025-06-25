# Yoga Planner - Development Blueprint

> **Status**: 🟢 Phase 1 - Canvas State Management  
> **Last Updated**: 2024-06-25  
> **Current Task**: CANVAS-001

## 📋 Project Overview

Building a yoga flow planner with multi-canvas support, auto-save, and user authentication. Users can create, edit, and manage multiple yoga flow canvases with tldraw integration.

### Core Features (MVP)
- ✅ Basic yoga pose placement with tldraw
- 🔄 Canvas state persistence and auto-save  
- ⭕ Multi-canvas management (create, rename, delete, switch)
- ⭕ User authentication (magic link)
- ⭕ Cloud sync with Supabase

## 🏗️ Architecture Decisions

- **Frontend**: React + Vite + TypeScript + tldraw
- **State**: Zustand for app state, tldraw for canvas state  
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Deployment**: Vercel
- **Auth**: Magic link (email OTP)

## 🚀 Development Phases

### Phase 1: Canvas State Management ⭕
**Goal**: Serialize, persist, and restore canvas state locally

- [ ] **CANVAS-001**: Implement canvas state serialization/deserialization
- [ ] **CANVAS-002**: Add localStorage persistence with auto-save
- [ ] **CANVAS-003**: Create canvas state management hooks
- [ ] **CANVAS-004**: Add error handling for state operations

### Phase 2: Multi-Canvas UI ⭕  
**Goal**: Build sidebar with canvas management

- [ ] **UI-001**: Create workspace layout (sidebar + canvas area)
- [ ] **UI-002**: Build canvas list sidebar component
- [ ] **UI-003**: Implement canvas CRUD operations
- [ ] **UI-004**: Add canvas switching with proper state management
- [ ] **UI-005**: Create loading states and error boundaries

### Phase 3: Authentication & Backend ⭕
**Goal**: Add user authentication and cloud persistence

- [ ] **AUTH-001**: Set up Supabase project and database schema
- [ ] **AUTH-002**: Implement magic link authentication
- [ ] **AUTH-003**: Create user context and auth hooks
- [ ] **AUTH-004**: Add sign out and account management
- [ ] **SYNC-001**: Implement cloud sync for canvas data
- [ ] **SYNC-002**: Add conflict resolution for canvas updates

### Phase 4: Polish & Production ⭕
**Goal**: Production-ready features and optimizations

- [ ] **PROD-001**: Add comprehensive error handling
- [ ] **PROD-002**: Implement proper loading states
- [ ] **PROD-003**: Add user onboarding flow
- [ ] **PROD-004**: Performance optimizations
- [ ] **PROD-005**: End-to-end testing

## 📝 Detailed Task Specifications

### CANVAS-001: Canvas State Serialization/Deserialization
**File**: `src/hooks/useCanvasState.ts`

**Requirements**:
- Create hook to serialize tldraw editor state using `editor.store.getSnapshot()`
- Implement deserialization to restore editor state from JSON
- Handle edge cases (empty canvas, corrupted data)
- Add TypeScript types for canvas state

**Acceptance Criteria**:
- Can save current canvas state to JSON
- Can load canvas state from JSON without errors
- State includes all yoga poses and their positions
- Hook has proper error handling and loading states

---

### CANVAS-002: localStorage Persistence with Auto-save
**File**: `src/hooks/useAutoSave.ts`

**Requirements**:
- Auto-save canvas state to localStorage with 2-second debounce
- Trigger save on Ctrl+S keyboard shortcut
- Store multiple canvases with unique keys
- Add save indicators (unsaved changes dot)

**Acceptance Criteria**:
- Canvas automatically saves after 2 seconds of inactivity
- Manual save works with Ctrl+S
- Multiple canvases stored separately
- Visual indicator shows save status

---

### CANVAS-003: Canvas State Management Hooks
**File**: `src/hooks/useCanvasManager.ts`

**Requirements**:
- Manage list of user's canvases
- CRUD operations: create, read, update, delete canvases
- Canvas metadata (id, title, lastModified, thumbnail)
- Default canvas creation

**Acceptance Criteria**:
- Can create new blank canvas
- Can rename canvas titles
- Can delete canvases with confirmation
- Generates canvas thumbnails for list view

---

### CANVAS-004: Error Handling for State Operations
**File**: `src/components/ErrorBoundary.tsx`

**Requirements**:
- React error boundary around canvas area
- Graceful handling of localStorage quota exceeded
- Recovery options for corrupted canvas data
- User-friendly error messages

**Acceptance Criteria**:
- App doesn't crash on canvas errors
- Clear error messages for users
- Recovery options provided
- Errors logged for debugging

## 🗂️ Future Considerations (Long List)

### Performance Optimizations
- [ ] Canvas JSON compression for large flows
- [ ] Lazy loading for canvas list
- [ ] Virtual scrolling for large pose collections
- [ ] Debounced search for pose filtering
- [ ] Image optimization for yoga pose SVGs

### UX Improvements  
- [ ] Keyboard shortcuts for canvas operations
- [ ] Undo/redo history beyond tldraw default
- [ ] Canvas templates and examples
- [ ] Drag-and-drop pose ordering
- [ ] Export flows as PDF/image
- [ ] Print-friendly flow layouts

### Advanced Features
- [ ] Real-time collaboration (multiple users)
- [ ] Canvas versioning and history
- [ ] Public flow sharing with links
- [ ] Flow templates and community sharing
- [ ] Mobile app support
- [ ] Offline-first with sync queue

### Technical Debt
- [ ] Comprehensive error boundaries
- [ ] Performance monitoring (PostHog/Sentry)
- [ ] End-to-end testing suite
- [ ] TypeScript strict mode
- [ ] Code splitting and lazy loading
- [ ] Bundle size optimization

### Business Features
- [ ] User usage analytics
- [ ] Canvas export limitations for free tier
- [ ] Premium features (advanced poses, templates)
- [ ] Team workspaces for yoga instructors
- [ ] Integration with fitness apps

## 🔄 Blueprint Update Instructions

**When completing a task:**
1. ✅ Mark the task as complete with checkmark
2. 📝 Update the "Current Task" at the top
3. 🗓️ Update "Last Updated" date
4. 📋 Add any new insights or changes to requirements
5. ⏭️ Move to next phase if phase is complete

**When starting a new phase:**
1. 🟢 Update status indicator (🟢 Active, ✅ Complete, ⭕ Pending)
2. 📍 Update current task reference
3. 📋 Review and update task requirements if needed

**When adding new requirements:**
1. 📝 Add to appropriate phase or long list
2. 🏷️ Use consistent task ID format (AREA-###)
3. ✅ Include acceptance criteria
4. 📂 Specify target files when possible

---

**Next Action**: Begin CANVAS-001 - Implement canvas state serialization/deserialization hook