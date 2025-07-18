# Yoga Planner - Development Blueprint

> **Status**: 🟢 Phase 4 - Polish & Production  
> **Last Updated**: 2024-12-19  
> **Current Task**: PROD-002 - Comprehensive Error Handling

## 📋 Project Overview

Building a yoga planner with multi-canvas support, auto-save, and user authentication. Users can create, edit, and manage multiple yoga flow canvases with tldraw integration.

### Core Features (MVP)
- ✅ Basic yoga pose placement with tldraw
- ✅ Canvas state serialization/deserialization
- ✅ localStorage persistence and auto-save  
- ✅ Multi-canvas management (create, rename, delete, switch)
- ✅ **NEW**: Folder organization system with smart UI rules
- ✅ **NEW**: Auto-cleanup of empty canvases
- ✅ Workspace layout with sidebar and canvas area
- ✅ User authentication (magic link)
- ✅ Cloud sync with Supabase + localStorage fallback
- ✅ **NEW**: Cloudflare Workers optimizations for multiple tabs/rooms
- ✅ **NEW**: Local development environment working perfectly
- ✅ **NEW**: Yoga pose color system working perfectly (style panel integration + accurate exports)
- ✅ **NEW**: Drag-and-drop improvements and UI polish (canvas activation, smooth animations, consistent styling)
- ✅ **NEW**: TypeScript error fixes and code cleanup (removed unused imports and variables)

## 🏗️ Architecture Decisions

- **Frontend**: React + Vite + TypeScript + tldraw
- **State**: Zustand for app state, tldraw for canvas state  
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Sync Server**: Cloudflare Workers + Durable Objects (optimized)
- **Deployment**: Vercel
- **Auth**: Magic link (email OTP)

## 🚀 Development Phases

### Phase 1: Canvas State Management ✅
**Goal**: Serialize, persist, and restore canvas state locally

- [x] **CANVAS-001**: Implement canvas state serialization/deserialization
- [x] **CANVAS-002**: Add localStorage persistence with auto-save
- [x] **CANVAS-003**: Create canvas state management hooks
- [⏸️] **CANVAS-004**: Add error handling for state operations *(deferred to Phase 4)*

### Phase 2: Multi-Canvas UI ✅
**Goal**: Build sidebar with canvas management

- [x] **UI-001**: Create workspace layout (sidebar + canvas area)
- [x] **UI-002**: Build canvas list sidebar component *(integrated into UI-001)*
- [x] **UI-003**: Implement canvas CRUD operations *(integrated into UI-001)*
- [x] **UI-004**: Add canvas switching with proper state management *(integrated into UI-001)*
- [⏸️] **UI-005**: Create loading states and error boundaries *(deferred to Phase 4)*

### Phase 3: Authentication & Backend ✅
**Goal**: Add user authentication and cloud persistence

- [✅] **AUTH-001**: Set up Supabase project and database schema
- [✅] **AUTH-002**: Implement magic link authentication
- [✅] **AUTH-003**: Create user context and auth hooks
- [✅] **AUTH-004**: Add sign out and account management
- [✅] **SYNC-001**: Implement cloud sync for canvas data
- [✅] **SYNC-002**: Add conflict resolution for canvas updates
- [✅] **SYNC-003**: Test and validate sync optimizations

### Phase 4: Polish & Production ✅
**Goal**: Production-ready features and optimizations

- [✅] **COLOR-001**: Fix yoga pose color system *(style panel integration + accurate exports)*
- [✅] **FOLDER-001**: Complete folder organization system *(creation, management, smart UI rules)*
- [✅] **CLEANUP-001**: Auto-cleanup of empty canvases *(workspace organization)*
- [✅] **PROD-001**: TypeScript fixes and code cleanup *(removed unused imports and variables)*
- [🔄] **PROD-002**: Add comprehensive error handling *(includes CANVAS-004 and UI-005)*
- [✅] **PROD-003**: Canvas deletion and folder management fixes *(robust deletion, sort order updates, immediate new canvas creation)*
- [⭕] **PROD-004**: Implement proper loading states
- [⭕] **PROD-005**: Add user onboarding flow
- [⭕] **PROD-006**: Performance optimizations
- [⭕] **PROD-007**: End-to-end testing

## 📝 Detailed Task Specifications

### ✅ CANVAS-001: Canvas State Serialization/Deserialization
**File**: `src/hooks/useCanvasState.ts`

**Requirements**:
- ✅ Create hook to serialize tldraw editor state using `editor.store.getSnapshot()`
- ✅ Implement deserialization to restore editor state from JSON
- ✅ Handle edge cases (empty canvas, corrupted data)
- ✅ Add TypeScript types for canvas state

**Acceptance Criteria**:
- ✅ Can save current canvas state to JSON
- ✅ Can load canvas state from JSON without errors
- ✅ State includes all yoga poses and their positions
- ✅ Hook has proper error handling and loading states

---

### ✅ CANVAS-002: localStorage Persistence with Auto-save
**File**: `src/hooks/useAutoSave.ts`

**Requirements**:
- ✅ Auto-save canvas state to localStorage with instant saving (0ms delay)
- ✅ Trigger save on Ctrl+S keyboard shortcut
- ✅ Store multiple canvases with unique keys
- ✅ Add save indicators (unsaved changes dot)

**Acceptance Criteria**:
- ✅ Canvas automatically saves instantly after changes
- ✅ Manual save works with Ctrl+S
- ✅ Multiple canvases stored separately
- ✅ Visual indicator shows save status

---

### ✅ CANVAS-003: Canvas State Management Hooks
**File**: `src/hooks/useCanvasManager.ts`, `src/components/FlowPlanner.tsx`

**Requirements**:
- ✅ Manage list of user's canvases
- ✅ CRUD operations: create, read, update, delete canvases
- ✅ Canvas metadata (id, title, lastModified, thumbnail)
- ✅ Default canvas creation
- ✅ Single-page-per-canvas model
- ✅ Custom page menu showing canvas title
- ✅ Canvas management UI in main menu
- ✅ **NEW**: LRU cache optimization for multiple canvases
- ✅ **NEW**: Canvas preloading and memory management

**Acceptance Criteria**:
- ✅ Can create new blank canvas
- ✅ Can rename canvas titles
- ✅ Can delete canvases with confirmation
- ✅ Canvas switching preserves state properly
- ✅ Single page per canvas enforced
- ✅ Canvas title displayed in page menu
- ✅ Proper state management when switching canvases
- ✅ **NEW**: LRU cache keeps only 3 canvases in memory
- ✅ **NEW**: Canvas preloading for better performance

---

### ⏸️ CANVAS-004: Error Handling for State Operations
**File**: `src/components/ErrorBoundary.tsx`

**Status**: Deferred to Phase 4 (Polish & Production)

**Note**: Error handling will be addressed later when we focus on production-ready features. The basic error handling in existing hooks is sufficient for development.

**Requirements**:
- React error boundary around canvas area
- Graceful handling of localStorage quota exceeded
- Recovery options for corrupted canvas data
- User-friendly error messages

**Acceptance Criteria**:
- [ ] App doesn't crash on canvas errors
- [ ] Clear error messages for users
- [ ] Recovery options provided
- [ ] Errors logged for debugging

---

### ✅ UI-001: Create Workspace Layout
**File**: `src/components/FlowPlanner.tsx`

**Requirements**:
- ✅ Create workspace layout component with sidebar and canvas area
- ✅ Implement responsive design for different screen sizes
- ✅ Add sidebar toggle functionality (always visible)
- ✅ Integrate existing FlowPlanner into the layout
- ✅ Canvas management functionality working (create, switch, rename, delete)
- ✅ New canvases start empty
- ✅ Canvas title display in page menu with proper system font

**Acceptance Criteria**:
- ✅ Sidebar and canvas area layout works
- ✅ Responsive design for mobile/desktop
- ✅ Sidebar functionality working (always visible)
- ✅ Canvas area properly sized
- ✅ Existing FlowPlanner functionality preserved
- ✅ Canvas management functionality working properly

---

### ✅ AUTH-001: Set up Supabase Project and Database Schema
**File**: `supabase/`, `src/lib/supabase.ts`

**Requirements**:
- ✅ Set up Supabase project with proper configuration
- ✅ Create database schema for users and canvases
- ✅ Set up authentication with magic link
- ✅ Configure Row Level Security (RLS) policies
- ✅ Create TypeScript types for database schema

**Acceptance Criteria**:
- ✅ Supabase project configured and accessible
- ✅ Database schema created with proper relationships
- ✅ Authentication configured for magic link
- ✅ RLS policies implemented for data security
- ✅ TypeScript types generated and working

---

### ✅ AUTH-002: Implement Magic Link Authentication
**File**: `src/hooks/useAuth.ts`, `src/components/AuthProvider.tsx`, `src/components/SignIn.tsx`

**Requirements**:
- ✅ Create authentication hook for magic link flow
- ✅ Implement sign in/sign out functionality
- ✅ Add authentication state management
- ✅ Create protected route wrapper
- ✅ Add loading states for auth operations

**Acceptance Criteria**:
- ✅ Users can sign in with email magic link
- ✅ Authentication state persists across sessions
- ✅ Protected routes redirect unauthenticated users
- ✅ Sign out functionality works properly
- ✅ Loading states shown during auth operations

---

### ✅ AUTH-003: Create User Context and Auth Hooks
**File**: `src/contexts/AuthContext.tsx`, `src/hooks/useUser.ts`

**Requirements**:
- ✅ Create React context for user authentication state
- ✅ Implement user profile management
- ✅ Add user preferences and settings
- ✅ Create hooks for accessing user data
- ✅ Add user avatar and profile display

**Acceptance Criteria**:
- ✅ User context provides authentication state
- ✅ User profile data accessible throughout app
- ✅ User preferences can be saved and loaded
- ✅ User avatar and profile display working
- ✅ Context properly handles auth state changes

---

### ✅ AUTH-004: Add Sign Out and Account Management
**File**: `src/components/AccountMenu.tsx`, `src/components/UserProfile.tsx`

**Requirements**:
- ✅ Create account management UI components
- ✅ Implement user profile editing
- ✅ Add account deletion functionality
- ✅ Create settings page for user preferences
- ✅ Add email verification status display

**Acceptance Criteria**:
- ✅ Users can edit their profile information
- ✅ Account deletion with confirmation works
- ✅ Settings page for user preferences
- ✅ Email verification status displayed
- ✅ Account management accessible from main UI

---

### ✅ SYNC-001: Implement Cloud Sync for Canvas Data
**File**: `src/hooks/useCloudSync.ts`, `src/services/canvasService.ts`

**Requirements**:
- ✅ Create cloud sync service for canvas data
- ✅ Implement real-time sync with Supabase
- ✅ Add offline support with sync queue
- ✅ Handle sync conflicts and resolution
- ✅ Add sync status indicators

**Acceptance Criteria**:
- ✅ Canvas data syncs to cloud automatically
- ✅ Real-time updates work across devices
- ✅ Offline changes queue for later sync
- ✅ Sync conflicts resolved gracefully
- ✅ Visual indicators show sync status

---

### ✅ SYNC-002: Add Conflict Resolution for Canvas Updates
**File**: `tldraw-sync-cloudflare/worker/TldrawDurableObject.ts`, `src/hooks/useCanvasManager.ts`

**Requirements**:
- ✅ **NEW**: Optimize Cloudflare Workers for multiple tabs/rooms
- ✅ **NEW**: Add connection pooling and hibernation
- ✅ **NEW**: Implement LRU cache for canvas management
- ✅ **NEW**: Add canvas preloading and memory management
- ✅ **NEW**: Optimize persistence with change detection
- ✅ **NEW**: Reduce bundle size with proper imports
- ✅ **NEW**: Add room stats monitoring endpoint

**Acceptance Criteria**:
- ✅ **NEW**: Multiple tabs/rooms handled efficiently
- ✅ **NEW**: Reduced Cloudflare Workers usage
- ✅ **NEW**: Better memory management for multiple canvases
- ✅ **NEW**: Faster hibernation for free tier
- ✅ **NEW**: Optimized persistence frequency
- ✅ **NEW**: Smaller bundle size maintained

---

### ✅ SYNC-003: Test and Validate Sync Optimizations
**File**: `tldraw-sync-cloudflare/test-worker.js`, Local development setup

**Requirements**:
- ✅ Test local development setup
- ✅ Validate multiple canvas performance
- ✅ Test connection pooling and hibernation
- ✅ Verify LRU cache functionality
- ✅ Test persistence optimizations
- ✅ Monitor Cloudflare Workers usage

**Acceptance Criteria**:
- ✅ Local development works without rate limits
- ✅ Multiple canvases perform well
- ✅ Connection pooling works correctly
- ✅ Hibernation reduces resource usage
- ✅ LRU cache manages memory properly
- ✅ Persistence optimizations work

---

### ✅ COLOR-001: Fix Yoga Pose Color System *(style panel integration + accurate exports)*
- ✅ **NEW**: Optimize Cloudflare Workers for multiple tabs/rooms
- ✅ **NEW**: Add connection pooling and hibernation
- ✅ **NEW**: Implement LRU cache for canvas management
- ✅ **NEW**: Add canvas preloading and memory management
- ✅ **NEW**: Optimize persistence with change detection
- ✅ **NEW**: Reduce bundle size with proper imports
- ✅ **NEW**: Add room stats monitoring endpoint

**Acceptance Criteria**:
- ✅ **NEW**: Multiple tabs/rooms handled efficiently
- ✅ **NEW**: Reduced Cloudflare Workers usage
- ✅ **NEW**: Better memory management for multiple canvases
- ✅ **NEW**: Faster hibernation for free tier
- ✅ **NEW**: Optimized persistence frequency
- ✅ **NEW**: Smaller bundle size maintained

---

### ✅ SCROLLBAR-001: Replace mac-scrollbar with SimpleBar
**Status**: ✅ COMPLETE  
**Files**: `src/components/FlowPlanner.tsx`, `src/index.css`, `src/simplebar.css`

**Requirements**:
- ✅ Replace problematic mac-scrollbar with SimpleBar
- ✅ Implement hover-only scrollbar visibility
- ✅ Add proper opacity and styling
- ✅ Fix gap between scrollable content and account settings
- ✅ Ensure consistent 8px width with no hover effects
- ✅ Copy SimpleBar CSS locally for proper Vite import

**Acceptance Criteria**:
- ✅ SimpleBar replaces mac-scrollbar completely
- ✅ Scrollbar only visible on hover with smooth fade-in
- ✅ Higher opacity (60% black) for better visibility
- ✅ No extra gap between content and account settings
- ✅ Consistent 8px width with no hover effects
- ✅ Local CSS import works properly with Vite

---

### 🔄 PROD-001: Add Comprehensive Error Handling
**File**: `src/components/ErrorBoundary.tsx`, `src/hooks/useErrorHandler.ts`

**Requirements**:
- Create React error boundary around canvas area
- Implement graceful handling of localStorage quota exceeded
- Add recovery options for corrupted canvas data
- Create user-friendly error messages
- Add error logging for debugging
- Handle WebSocket connection errors
- Add retry mechanisms for failed operations

**Acceptance Criteria**:
- [ ] App doesn't crash on canvas errors
- [ ] Clear error messages for users
- [ ] Recovery options provided
- [ ] Errors logged for debugging
- [ ] Graceful handling of localStorage issues
- [ ] WebSocket connection errors handled
- [ ] Retry mechanisms for failed operations

---

### ⭕ PROD-002: Implement Proper Loading States
**File**: `src/components/LoadingStates.tsx`, `src/hooks/useLoadingState.ts`

**Requirements**:
- Create loading state management hook
- Add loading indicators for canvas operations
- Implement skeleton screens for better UX
- Add progress indicators for long operations
- Handle loading states for authentication
- Add loading states for sync operations

**Acceptance Criteria**:
- [ ] Loading states for all async operations
- [ ] Skeleton screens for better perceived performance
- [ ] Progress indicators for long operations
- [ ] Smooth transitions between states
- [ ] Loading states don't block UI

---

### ⭕ PROD-003: Add User Onboarding Flow
**File**: `src/components/Onboarding.tsx`, `src/hooks/useOnboarding.ts`

**Requirements**:
- Create onboarding flow component
- Add welcome tour for new users
- Implement feature discovery tooltips
- Add interactive tutorials
- Create help documentation
- Add keyboard shortcuts guide

**Acceptance Criteria**:
- [ ] New users see welcome tour
- [ ] Feature discovery tooltips work
- [ ] Interactive tutorials available
- [ ] Help documentation accessible
- [ ] Keyboard shortcuts guide provided

---

### ⭕ PROD-004: Performance Optimizations
**File**: `src/utils/performance.ts`, `src/hooks/usePerformance.ts`

**Requirements**:
- Implement code splitting and lazy loading
- Add performance monitoring
- Optimize bundle size
- Add caching strategies
- Implement virtual scrolling for large lists
- Add performance metrics tracking

**Acceptance Criteria**:
- [ ] Code splitting reduces initial bundle size
- [ ] Performance monitoring in place
- [ ] Bundle size optimized
- [ ] Caching strategies implemented
- [ ] Virtual scrolling for large lists
- [ ] Performance metrics tracked

---

### ⭕ PROD-005: End-to-End Testing
**File**: `tests/`, `cypress/`, `src/__tests__/`

**Requirements**:
- Set up testing framework (Cypress/Playwright)
- Write end-to-end tests for core flows
- Add unit tests for critical components
- Implement integration tests
- Add visual regression tests
- Set up CI/CD testing pipeline

**Acceptance Criteria**:
- [ ] End-to-end tests cover core flows
- [ ] Unit tests for critical components
- [ ] Integration tests working
- [ ] Visual regression tests implemented
- [ ] CI/CD pipeline includes testing
- [ ] Test coverage meets standards

---

### ✅ DB-002: User-Linked Canvases & Folders

**Files:**  
- `supabase/schema.sql`  
- `src/lib/supabase.ts`  
- `src/services/canvasService.ts`
- `src/hooks/useCanvasManager.ts`  
- `src/hooks/useAutoSave.ts`  
- `src/components/FlowPlanner.tsx`  
- `src/components/FolderPanel.tsx` (integrated into FlowPlanner)

**Requirements:**
- [✅] Add `folders` table to Supabase schema (with user_id, parent_folder_id, etc.)
- [✅] Add `folder_id` to `canvases` table (nullable, with FK)
- [✅] Update Supabase RLS policies for folders/canvases
- [✅] Update TypeScript types for new schema
- [✅] Create folder CRUD API (create, rename, delete, move)
- [✅] Update canvas CRUD to support folder assignment
- [✅] Update UI to allow folder creation, renaming, deletion, and canvas management within folders
- [✅] On login, load user's folders and canvases from Supabase
- [✅] On canvas/folder change, sync to Supabase with localStorage fallback
- [✅] Ensure all queries are user-specific (no cross-user data leaks)
- [✅] Preserve real-time sync and offline support

**Acceptance Criteria:**
- [✅] Users see only their own canvases and folders
- [✅] Users can create, rename, delete, and organize folders
- [✅] Users can create canvases within folders
- [✅] All canvas/folder changes persist to Supabase and sync across devices
- [✅] Real-time collaboration and offline support still work
- [✅] UI is intuitive for folder/canvas management

---

### ✅ FOLDER-001: Complete Folder Organization System
**File**: `src/components/FlowPlanner.tsx`, `src/hooks/useCanvasManager.ts`, `src/services/canvasService.ts`

**Requirements**:
- ✅ Create folder CRUD operations (create, rename, delete)
- ✅ Add canvas creation within folders
- ✅ Implement smart folder opening/closing rules
- ✅ Add Supabase integration with localStorage fallback
- ✅ Create folder UI with consistent design system
- ✅ Add folder state management and tracking

**Smart Folder Rules Implemented**:
- ✅ Only one folder open at a time (exceptions for empty folders)
- ✅ Top-level canvas selection closes all folders
- ✅ Folder canvas selection opens that folder automatically
- ✅ Manual folder browsing allowed while working
- ✅ Clean folder state management on canvas switching

**Acceptance Criteria**:
- ✅ Users can create, rename, and delete folders
- ✅ Canvases can be created within folders
- ✅ Smart folder opening/closing provides intuitive UX
- ✅ Folder state persists across sessions
- ✅ Supabase sync with localStorage fallback works
- ✅ Folder UI matches design system (neumorphic shadows, warm colors)

---

### ✅ CLEANUP-001: Auto-cleanup of Empty Canvases
- ✅ Track newly created empty canvases
- ✅ Implement cleanup triggers (canvas switching, folder actions, new creation)
- ✅ Add content detection to protect canvases with shapes
- ✅ Real-time monitoring of canvas content changes
- ✅ Integration with folder management system

**Current Status**: ✅ COMPLETE - AUTO-CLEANUP SYSTEM WORKING
- ✅ Empty canvases automatically deleted on user actions
- ✅ Canvases with content protected from deletion
- ✅ Clean workspace maintained automatically
- ✅ No interference with active work

### ✅ DRAGDROP-001: Drag-and-Drop Improvements and UI Polish
- ✅ Fix canvas click vs drag activation (distance: 15px, delay: 100ms)
- ✅ Remove verbose console logs for cleaner output
- ✅ Fix delete folder button styling to match account settings
- ✅ Add smooth folder open/close animation (0.3s ease)
- ✅ Fix parent div overflow visible for nested canvases
- ✅ Fix RLS policy issue in canvas reordering (individual updates)
- ✅ Auto-switch to dragged canvas on drag start
- ✅ Center text in account settings buttons
- ✅ Move account settings 40px lower in sidebar
- ✅ Remove bottom margin from last canvas in root folder
- ✅ Make drop zone height match single canvas button (36px)
- ✅ Remove SupabaseTest debug UI component

**Current Status**: ✅ COMPLETE - DRAG-AND-DROP SYSTEM POLISHED
- ✅ Canvas clicks work properly without accidental drags
- ✅ Canvas dragging works smoothly with proper activation
- ✅ Dragged canvas automatically becomes active and stays open
- ✅ Folder animations are smooth and consistent
- ✅ Delete buttons have consistent styling across the app
- ✅ Console output is clean with only essential logs
- ✅ RLS policy issues resolved for canvas reordering
- ✅ UI spacing and positioning is consistent and polished

### ✅ PROD-001: TypeScript Fixes and Code Cleanup
- ✅ Remove unused `isLast` prop from DraggableCanvasRow component
- ✅ Remove unused `DroppableContainer` and `Active` type imports
- ✅ Remove unused `isEmpty` and `shouldShowStyledBackground` variables
- ✅ Remove unused `arrayMove` import from useSidebarDragAndDrop
- ✅ Clean up component interfaces and function parameters
- ✅ Ensure build passes without TypeScript errors

**Current Status**: ✅ COMPLETE - TYPESCRIPT ERRORS RESOLVED
- ✅ All TypeScript errors fixed and build passes successfully
- ✅ Unused code removed for cleaner codebase
- ✅ Component interfaces properly cleaned up
- ✅ No unused imports or variables remaining
- ✅ Production build ready with no errors

---

### ✅ PROD-003: Canvas Deletion and Folder Management Fixes
**File**: `src/hooks/useCanvasManager.ts`, `src/services/canvasService.ts`, `src/components/FlowPlanner.tsx`

**Requirements**:
- ✅ Fix aggressive folder closing during canvas deletion
- ✅ Resolve race conditions in canvas selection after deletion
- ✅ Prevent auto-creation of "Untitled Flow" during deletion
- ✅ Synchronize `currentCanvasId` states between FlowPlanner and useCanvasManager
- ✅ Update canvas sort orders in database after deletion
- ✅ Create new canvas immediately when last canvas is deleted

**Implementation Details**:
- ✅ Modified folder closing logic to be conservative (only on deliberate top-level switches)
- ✅ Added deletion flag to prevent auto-creation during deletion process
- ✅ Fixed canvas selection timing to occur after data reload completion
- ✅ Synchronized FlowPlanner's `currentCanvasId` with hook's current canvas
- ✅ Updated `deleteCanvas` service to renumber sort orders using Supabase RPC
- ✅ Added immediate new canvas creation when last canvas is deleted

**Current Status**: ✅ COMPLETE - ROBUST CANVAS DELETION SYSTEM
- ✅ Canvas deletion works smoothly without folder interference
- ✅ Sort orders properly updated in database after deletion
- ✅ New canvas immediately created and activated when last canvas deleted
- ✅ No race conditions or duplicate loading attempts
- ✅ Folder state management works correctly during deletion
- ✅ Clean user experience with proper canvas activation

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

**Next Action**: Continue PROD-002 - Add Comprehensive Error Handling