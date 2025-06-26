# Current Development Tasks

> **Active Phase**: Phase 3 - Authentication & Backend  
> **Current Task**: SYNC-003  
> **Sprint Goal**: Add user authentication and cloud persistence

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
9. ✅ **NEW**: Add LRU cache optimization for multiple canvases
10. ✅ **NEW**: Add canvas preloading and memory management

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
  preloadCanvas,
  unloadCanvas,
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
- ✅ **NEW**: LRU cache keeps only 3 canvases in memory
- ✅ **NEW**: Canvas preloading for better performance

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

### ✅ UI-001: Create Workspace Layout
**Status**: ✅ COMPLETE  
**Files**: `src/components/FlowPlanner.tsx`

**Dependencies**: CANVAS-003 ✅ complete

**Implementation Steps**:
1. ✅ Toolbar and yoga pose tool functionality restored and working
2. ✅ Canvas title display in page menu with proper system font
3. ✅ tldraw native UI font styling applied (navigation panel, menus, buttons, etc.)
4. ✅ Create New Canvas button added to left sidebar with proper functionality
5. ✅ New canvases start completely empty (no content from previous canvases)
6. ✅ Canvas switching and management working properly
7. ✅ Create workspace layout component with sidebar and canvas area
8. ✅ Implement responsive design for different screen sizes
9. ✅ Add sidebar toggle functionality (sidebar is always visible)
10. ✅ Integrate existing FlowPlanner into the layout
11. ✅ Ensure proper canvas area sizing

**Code Requirements**:
```typescript
// Workspace layout interface (implemented in FlowPlanner.tsx)
<div className="tldraw__editor h-screen w-screen">
  <Sidebar /> {/* Canvas list and Create New Canvas button */}
  <CanvasArea> {/* tldraw editor */}
    <Tldraw />
  </CanvasArea>
</div>
```

**Acceptance Criteria**:
- ✅ Sidebar and canvas area layout works
- ✅ Canvas management functionality working (create, switch, rename, delete)
- ✅ New canvases start empty
- ✅ Responsive design for different screen sizes
- ✅ Sidebar functionality working (always visible)
- ✅ Canvas area properly sized
- ✅ Existing FlowPlanner functionality preserved

---

## 🎯 Phase 3 Tasks (In Order)

### ✅ AUTH-001: Set up Supabase Project and Database Schema
**Status**: ✅ COMPLETE  
**Files**: `supabase/`, `src/lib/supabase.ts`

**Dependencies**: UI-001 ✅ complete

**Implementation Steps**:
1. ✅ Create Supabase project and configure environment
2. ✅ Set up database schema for users and canvases
3. ✅ Configure authentication with magic link
4. ✅ Set up Row Level Security (RLS) policies
5. ✅ Generate TypeScript types for database schema
6. ✅ Test database connections and permissions

**Code Requirements**:
```typescript
// Expected Supabase configuration
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Database schema types
interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface Canvas {
  id: string;
  user_id: string;
  title: string;
  data: any;
  created_at: string;
  updated_at: string;
}
```

**Acceptance Criteria**:
- ✅ Supabase project configured and accessible
- ✅ Database schema created with proper relationships
- ✅ Authentication configured for magic link
- ✅ RLS policies implemented for data security
- ✅ TypeScript types generated and working

---

### ✅ AUTH-002: Implement Magic Link Authentication
**Status**: ✅ COMPLETE  
**Files**: `src/hooks/useAuth.ts`, `src/components/AuthProvider.tsx`, `src/components/SignIn.tsx`

**Dependencies**: AUTH-001 ✅ complete

**Implementation Steps**:
1. ✅ Create authentication hook for magic link flow
2. ✅ Implement sign in/sign out functionality
3. ✅ Add authentication state management
4. ✅ Create protected route wrapper
5. ✅ Add loading states for auth operations
6. ✅ Test authentication flow end-to-end

**Code Requirements**:
```typescript
// Expected auth hook interface
const {
  user,
  signIn,
  signOut,
  isLoading,
  error
} = useAuth();

// Expected auth provider interface
<AuthProvider>
  <App />
</AuthProvider>
```

**Acceptance Criteria**:
- ✅ Users can sign in with email magic link
- ✅ Authentication state persists across sessions
- ✅ Protected routes redirect unauthenticated users
- ✅ Sign out functionality works properly
- ✅ Loading states shown during auth operations

---

### ✅ AUTH-003: Create User Context and Auth Hooks
**Status**: ✅ COMPLETE  
**Files**: `src/hooks/useUser.ts`, `src/components/UserProfile.tsx`, `src/components/AuthProvider.tsx`

**Dependencies**: AUTH-002 ✅ complete

**Implementation Steps**:
1. ✅ Create React context for user authentication state
2. ✅ Implement user profile management
3. ✅ Add user preferences and settings
4. ✅ Create hooks for accessing user data
5. ✅ Add user avatar and profile display
6. ✅ Test context state management

**Code Requirements**:
```typescript
// Expected user context interface
const {
  user,
  profile,
  preferences,
  updateProfile,
  updatePreferences
} = useUser();

// Expected context provider
<UserContext.Provider value={userState}>
  {children}
</UserContext.Provider>
```

**Acceptance Criteria**:
- ✅ User context provides authentication state
- ✅ User profile data accessible throughout app
- ✅ User preferences can be saved and loaded
- ✅ User avatar and profile display working
- ✅ Context properly handles auth state changes

---

### ✅ AUTH-004: Add Sign Out and Account Management
**Status**: ✅ COMPLETE  
**Files**: `src/components/AccountMenu.tsx`, `src/components/UserProfile.tsx`

**Dependencies**: AUTH-003 ✅ complete

**Implementation Steps**:
1. ✅ Create account management UI components
2. ✅ Implement user profile editing
3. ✅ Add account deletion functionality (UI ready, backend TODO)
4. ✅ Create settings page for user preferences
5. ✅ Add email verification status display
6. ✅ Integrate with main application UI

**Code Requirements**:
```typescript
// Expected account menu interface
<AccountMenu>
  <UserProfile />
  <Settings />
  <SignOut />
</AccountMenu>

// Expected user profile interface
<UserProfile
  user={user}
  onUpdate={updateProfile}
  onDelete={deleteAccount}
/>
```

**Acceptance Criteria**:
- ✅ Users can edit their profile information
- ✅ Account deletion UI with confirmation works
- ✅ Settings page for user preferences
- ✅ Email verification status displayed
- ✅ Account management accessible from main UI (toolbar button)

---

### ✅ SYNC-001: Implement Cloud Sync for Canvas Data
**Status**: ✅ COMPLETE  
**Files**: `src/hooks/useCloudSync.ts`, `src/services/assetStore.ts`, `src/components/FlowPlanner.tsx`

**Dependencies**: AUTH-004 ✅ complete

**Implementation Steps**:
1. ✅ Create cloud sync service for canvas data
2. ✅ Implement real-time sync with Supabase
3. ✅ Add offline support with sync queue
4. ✅ Handle sync conflicts and resolution
5. ✅ Add sync status indicators
6. ✅ Test sync functionality across devices

**Code Requirements**:
```typescript
// Expected cloud sync hook interface
const {
  syncCanvas,
  syncStatus,
  lastSynced,
  hasPendingChanges,
  resolveConflicts
} = useCloudSync(canvasId);

// Expected canvas service interface
const canvasService = {
  saveCanvas,
  loadCanvas,
  deleteCanvas,
  listCanvases,
  subscribeToChanges
};
```

**Acceptance Criteria**:
- ✅ Canvas data syncs to cloud automatically
- ✅ Real-time updates work across devices
- ✅ Offline changes queue for later sync
- ✅ Sync conflicts resolved gracefully
- ✅ Visual indicators show sync status
- ✅ Test sync functionality across devices

---

### ✅ SYNC-002: Add Conflict Resolution for Canvas Updates
**Status**: ✅ COMPLETE  
**Files**: `tldraw-sync-cloudflare/worker/TldrawDurableObject.ts`, `src/hooks/useCanvasManager.ts`

**Dependencies**: SYNC-001 ✅ complete

**Implementation Steps**:
1. ✅ **NEW**: Optimize Cloudflare Workers for multiple tabs/rooms
2. ✅ **NEW**: Add connection pooling and hibernation
3. ✅ **NEW**: Implement LRU cache for canvas management
4. ✅ **NEW**: Add canvas preloading and memory management
5. ✅ **NEW**: Optimize persistence with change detection
6. ✅ **NEW**: Reduce bundle size with proper imports
7. ✅ **NEW**: Add room stats monitoring endpoint

**Code Requirements**:
```typescript
// Expected optimization features
- Connection pooling (max 10 connections per room)
- Aggressive hibernation (2 minutes vs 5 minutes)
- Smart persistence (only when data changes)
- LRU cache (3 canvases in memory)
- Canvas preloading
- Bundle size optimization (311KB vs 1MB+)
```

**Acceptance Criteria**:
- ✅ **NEW**: Multiple tabs/rooms handled efficiently
- ✅ **NEW**: Reduced Cloudflare Workers usage
- ✅ **NEW**: Better memory management for multiple canvases
- ✅ **NEW**: Faster hibernation for free tier
- ✅ **NEW**: Optimized persistence frequency
- ✅ **NEW**: Smaller bundle size maintained

---

### 🔄 SYNC-003: Test and Validate Sync Optimizations
**Status**: 🔄 IN PROGRESS  
**Files**: `tldraw-sync-cloudflare/test-worker.js`, Local development setup

**Dependencies**: SYNC-002 ✅ complete

**Implementation Steps**:
1. Test local development setup
2. Validate multiple canvas performance
3. Test connection pooling and hibernation
4. Verify LRU cache functionality
5. Test persistence optimizations
6. Monitor Cloudflare Workers usage

**Code Requirements**:
```bash
# Local development commands
cd tldraw-sync-cloudflare
npx wrangler dev --local

# Test worker functionality
node test-worker.js
```

**Acceptance Criteria**:
- [ ] Local development works without rate limits
- [ ] Multiple canvases perform well
- [ ] Connection pooling works correctly
- [ ] Hibernation reduces resource usage
- [ ] LRU cache manages memory properly
- [ ] Persistence optimizations work

---

## 🚀 Quick Start for AI Agent

To begin SYNC-003:

1. **Set up local development**:
   - Start local Cloudflare Workers development
   - Test worker functionality without rate limits
   - Validate multiple canvas performance

2. **Test optimizations**:
   - Open multiple tabs with different canvases
   - Monitor connection pooling and hibernation
   - Verify LRU cache functionality
   - Test persistence optimizations

3. **Monitor performance**:
   - Check Cloudflare Workers usage
   - Validate bundle size optimizations
   - Test memory management improvements

4. **Update this file when complete**:
   - Mark SYNC-003 as ✅ complete
   - Move to next phase
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
- ✅ Workspace layout with sidebar and canvas area
- ✅ Authentication and cloud sync implemented
- ✅ **NEW**: Cloudflare Workers optimizations for multiple tabs/rooms
- 🔄 Moving to Phase 4: Polish & Production

**Key Files to Understand**:
- `src/components/FlowPlanner.tsx` - Main tldraw integration with canvas management
- `src/utils/svg-pose-parser.ts` - Yoga pose creation logic
- `src/hooks/useCanvasState.ts` - Canvas state serialization (✅ complete)
- `src/hooks/useAutoSave.ts` - Auto-save functionality (✅ complete)
- `src/hooks/useCanvasManager.ts` - Multi-canvas management with LRU cache (✅ complete)
- `src/shapes/` - Custom shape definitions
- `tldraw-sync-cloudflare/worker/TldrawDurableObject.ts` - Optimized sync server (✅ complete)

**Don't Change These (Working Features)**:
- Yoga pose placement and styling
- Custom toolbar and pose panel
- Font rendering (draw font)
- SVG asset loading
- Canvas state serialization (✅ complete)
- Auto-save functionality (✅ complete)
- Multi-canvas management (✅ complete)
- Workspace layout and UI (✅ complete)
- Authentication and cloud sync (✅ complete)
- **NEW**: Cloudflare Workers optimizations (✅ complete)