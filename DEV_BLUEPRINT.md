# Yoga Planner - Development Blueprint

> **Status**: 🟢 Phase 4 - Polish & Production  
> **Last Updated**: 2024-12-19  
> **Current Task**: PROD-001

## 📋 Project Overview

Building a yoga flow planner with multi-canvas support, auto-save, and user authentication. Users can create, edit, and manage multiple yoga flow canvases with tldraw integration.

### Core Features (MVP)
- ✅ Basic yoga pose placement with tldraw
- ✅ Canvas state serialization/deserialization
- ✅ localStorage persistence and auto-save  
- ✅ Multi-canvas management (create, rename, delete, switch)
- ✅ Workspace layout with sidebar and canvas area
- ✅ User authentication (magic link)
- ✅ Cloud sync with Supabase
- ✅ **NEW**: Cloudflare Workers optimizations for multiple tabs/rooms
- ✅ **NEW**: Local development environment working perfectly
- ✅ **NEW**: Yoga pose color system working perfectly (style panel integration + accurate exports)

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

### Phase 4: Polish & Production 🔄
**Goal**: Production-ready features and optimizations

- [✅] **COLOR-001**: Fix yoga pose color system *(style panel integration + accurate exports)*
- [🔄] **PROD-001**: Add comprehensive error handling *(includes CANVAS-004 and UI-005)*
- [⭕] **PROD-002**: Implement proper loading states
- [⭕] **PROD-003**: Add user onboarding flow
- [⭕] **PROD-004**: Performance optimizations
- [⭕] **PROD-005**: End-to-end testing

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

### ✅ COLOR-001: Fix Yoga Pose Color System
**File**: `src/shapes/yoga-pose-svg-shape.ts`, `src/utils/svg-pose-parser.ts`

**Requirements**:
- ✅ Fix color detection from style panel when pasting poses
- ✅ Update `createPoseFromSVG` to get current style from selected shapes or editor state
- ✅ Fix nested color property access in editor's next styles
- ✅ Update `toSvg` method to use tldraw's `DefaultColorThemePalette` for accurate export colors
- ✅ Add comprehensive color mapping for all tldraw color variants
- ✅ Ensure export colors match exactly what's displayed in the app

**Acceptance Criteria**:
- ✅ Poses appear in the selected color from style panel immediately
- ✅ Color selector shows in style panel when yoga pose tool is active
- ✅ Export colors match exactly what's displayed in the app
- ✅ All tldraw color variants (light-green, light-blue, etc.) work correctly
- ✅ Color detection works from both selected shapes and editor state
- ✅ Export uses tldraw's actual color theme values

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

**Next Action**: Begin PROD-001 - Add Comprehensive Error Handling