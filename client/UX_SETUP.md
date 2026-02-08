# UX Improvements - Quick Setup Guide

Quick reference for implementing UX improvements in your components.

## 📁 Files Created

### 1. Loading Components
**`src/components/Loading/LoadingStates.tsx`**
- ✅ Spinner (sm, md, lg, xl sizes)
- ✅ ProjectListSkeleton
- ✅ GanttChartSkeleton
- ✅ TaskListSkeleton
- ✅ VersionListSkeleton
- ✅ ProgressiveLoader
- ✅ LoadingOverlay

### 2. Empty State Components
**`src/components/EmptyStates/EmptyStates.tsx`**
- ✅ NoProjects
- ✅ NoTasks
- ✅ NoVersions
- ✅ NoSearchResults
- ✅ ErrorState
- ✅ OfflineState
- ✅ PermissionDenied

### 3. Keyboard Shortcuts
**`src/hooks/useKeyboardShortcuts.ts`**
- ✅ useKeyboardShortcuts hook
- ✅ createCommonShortcuts helper
- ✅ createNavigationShortcuts helper
- ✅ Platform-aware (Mac/Windows)

**`src/components/KeyboardShortcuts/ShortcutHelpModal.tsx`**
- ✅ ShortcutHelpModal component
- ✅ ShortcutBadge component
- ✅ ShortcutHint component

### 4. Accessibility Utilities
**`src/hooks/useAccessibility.ts`**
- ✅ useFocusTrap
- ✅ useAutoFocus
- ✅ useFocusRestore
- ✅ useAnnouncer
- ✅ useRovingTabIndex
- ✅ useAccessibleField
- ✅ useLoadingAnnouncement
- ✅ usePrefersReducedMotion
- ✅ VisuallyHidden component

### 5. Responsive Design
**`src/hooks/useResponsive.ts`**
- ✅ useBreakpoint
- ✅ useIsMobile, useIsTablet, useIsDesktop
- ✅ useIsTouchDevice
- ✅ useWindowSize, useElementSize
- ✅ useOrientation
- ✅ useSidebarState
- ✅ useTouchGestures
- ✅ useScrollLock

---

## 🚀 Quick Start

### 1. Add Loading State

```tsx
import { ProjectListSkeleton } from './components/Loading/LoadingStates'

function ProjectList({ loading, projects }) {
  if (loading) {
    return <ProjectListSkeleton count={5} />
  }

  return <div>{/* Project list */}</div>
}
```

### 2. Add Empty State

```tsx
import { NoProjects } from './components/EmptyStates/EmptyStates'

function ProjectList({ projects, onCreateProject }) {
  if (projects.length === 0) {
    return (
      <NoProjects
        onCreateProject={onCreateProject}
        onImport={handleImport}
      />
    )
  }

  return <div>{/* Project list */}</div>
}
```

### 3. Add Keyboard Shortcuts

```tsx
import { useKeyboardShortcuts, createCommonShortcuts } from './hooks/useKeyboardShortcuts'

function MyComponent() {
  const shortcuts = createCommonShortcuts({
    onSave: () => handleSave(),
    onNew: () => handleCreate(),
    onDelete: () => handleDelete(),
  })

  useKeyboardShortcuts({ shortcuts })

  return <div>{/* Component */}</div>
}
```

### 4. Add Accessibility

```tsx
import { useAnnouncer } from './hooks/useAccessibility'

function MyComponent() {
  const { announce } = useAnnouncer()

  const handleSave = async () => {
    await saveData()
    announce('Project saved successfully', 'polite')
  }

  return (
    <button
      onClick={handleSave}
      aria-label="Save project (Cmd+S)"
    >
      Save
    </button>
  )
}
```

### 5. Add Responsive Design

```tsx
import { useIsMobile } from './hooks/useResponsive'

function MyComponent() {
  const isMobile = useIsMobile()

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4`}>
      {/* Content */}
    </div>
  )
}
```

---

## 🎯 Common Patterns

### Pattern 1: Full Page with Loading/Empty States

```tsx
function ProjectList({ loading, projects, onCreateProject }) {
  if (loading) {
    return <ProjectListSkeleton count={5} />
  }

  if (projects.length === 0) {
    return <NoProjects onCreateProject={onCreateProject} />
  }

  return <div>{/* Project list */}</div>
}
```

### Pattern 2: Search with No Results

```tsx
function SearchableList({ items, searchQuery, onClearSearch }) {
  if (items.length === 0 && searchQuery) {
    return (
      <NoSearchResults
        searchQuery={searchQuery}
        onClear={onClearSearch}
      />
    )
  }

  return <div>{/* Results */}</div>
}
```

### Pattern 3: Error State with Retry

```tsx
function DataView({ data, error, isLoading, refetch }) {
  if (error) {
    return (
      <ErrorState
        title="Failed to load data"
        description={error.message}
        onRetry={refetch}
      />
    )
  }

  if (isLoading) {
    return <Spinner size="lg" />
  }

  return <div>{/* Data */}</div>
}
```

### Pattern 4: Keyboard Shortcuts with Help

```tsx
function App() {
  const [showHelp, setShowHelp] = useState(false)

  const shortcuts = createCommonShortcuts({
    onSave: handleSave,
    onNew: handleCreate,
  })

  useKeyboardShortcuts({
    shortcuts: [
      ...shortcuts,
      {
        key: '?',
        modifiers: ['shift'],
        handler: () => setShowHelp(true),
        description: 'Show keyboard shortcuts',
      },
    ],
  })

  return (
    <>
      <MainApp />
      <ShortcutHelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />
    </>
  )
}
```

### Pattern 5: Responsive Sidebar

```tsx
function Layout() {
  const { isOpen, toggle, isMobile } = useSidebarState()

  return (
    <div className="flex">
      {/* Mobile menu button */}
      {isMobile && (
        <button onClick={toggle}>
          {isOpen ? 'Close' : 'Open'} Menu
        </button>
      )}

      {/* Sidebar - hidden on mobile when closed */}
      {(!isMobile || isOpen) && (
        <aside className="w-64">
          <Sidebar />
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1">
        <Content />
      </main>
    </div>
  )
}
```

### Pattern 6: Touch Gestures

```tsx
function SwipeableCarousel() {
  const [index, setIndex] = useState(0)

  const ref = useTouchGestures({
    onSwipeLeft: () => setIndex(i => Math.min(i + 1, items.length - 1)),
    onSwipeRight: () => setIndex(i => Math.max(i - 1, 0)),
    threshold: 50,
  })

  return (
    <div ref={ref}>
      {items[index]}
    </div>
  )
}
```

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action | Implementation |
|----------|--------|----------------|
| `Cmd/Ctrl + S` | Save | `onSave` |
| `Cmd/Ctrl + N` | New | `onNew` |
| `Cmd/Ctrl + F` | Search | `onSearch` |
| `Cmd/Ctrl + Z` | Undo | `onUndo` |
| `Cmd/Ctrl + Shift + Z` | Redo | `onRedo` |
| `Delete` | Delete | `onDelete` |
| `Escape` | Cancel | `onEscape` |
| `Shift + ?` | Help | Show shortcuts modal |
| `Arrow Up/Down` | Navigate | List navigation |
| `Enter` | Confirm | Open/select item |

---

## ♿ Accessibility Checklist

For each component:

- [ ] All interactive elements have `aria-label`
- [ ] Forms have proper labels and error announcements
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works
- [ ] Screen reader announcements for dynamic changes
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets are minimum 44x44px

Example:
```tsx
<button
  onClick={handleAction}
  aria-label="Save project (Cmd+S)"
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  Save
</button>
```

---

## 📱 Responsive Breakpoints

```typescript
xs: 0px      // Mobile (< 640px)
sm: 640px    // Large mobile
md: 768px    // Tablet
lg: 1024px   // Desktop
xl: 1280px   // Large desktop
2xl: 1536px  // Extra large desktop
```

Usage:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {/* Responsive grid */}
</div>
```

---

## 🎨 Component Examples

### Spinner Sizes

```tsx
<Spinner size="sm" />   // 16px (w-4 h-4)
<Spinner size="md" />   // 24px (w-6 h-6) - default
<Spinner size="lg" />   // 32px (w-8 h-8)
<Spinner size="xl" />   // 48px (w-12 h-12)
```

### Loading Overlay

```tsx
<LoadingOverlay
  isLoading={loading}
  message="Saving changes..."
  blur={true}
>
  <Form />
</LoadingOverlay>
```

### Progressive Loader

```tsx
<ProgressiveLoader
  isLoading={loading}
  itemsLoaded={loadedCount}
  totalItems={totalCount}
>
  <LargeDataset />
</ProgressiveLoader>
```

---

## 🐛 Troubleshooting

### Keyboard Shortcuts Not Working

**Problem:** Shortcuts not triggering

**Solution:** Check if focus is in an input field
```tsx
// Shortcuts are disabled in inputs by default
// To enable, set preventDefault: false
{
  key: 's',
  modifiers: ['meta'],
  handler: handleSave,
  preventDefault: true, // This disables in inputs
}
```

### Screen Reader Not Announcing

**Problem:** Changes not announced to screen readers

**Solution:** Use the announcer hook
```tsx
const { announce } = useAnnouncer()

const handleAction = () => {
  doAction()
  announce('Action completed', 'polite')
}
```

### Mobile Layout Issues

**Problem:** Layout not responsive

**Solution:** Use responsive classes
```tsx
// Bad
<div className="grid-cols-3">

// Good
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Touch Gestures Not Working

**Problem:** Swipe not detected

**Solution:** Check threshold and container
```tsx
// Increase threshold if swipes are too sensitive
const ref = useTouchGestures({
  onSwipeLeft: handleSwipe,
  threshold: 100, // Increase from default 50
})

// Ensure container has touch-action: none
<div ref={ref} className="touch-none">
```

---

## 📚 Component Reference

### Loading States

| Component | Use Case | Props |
|-----------|----------|-------|
| `Spinner` | General loading | `size`, `color` |
| `ProjectListSkeleton` | Project list loading | `count` |
| `GanttChartSkeleton` | Gantt chart loading | - |
| `TaskListSkeleton` | Task list loading | `count` |
| `ProgressiveLoader` | Large dataset | `isLoading`, `itemsLoaded`, `totalItems` |

### Empty States

| Component | Use Case | Props |
|-----------|----------|-------|
| `NoProjects` | No projects | `onCreateProject`, `onImport` |
| `NoTasks` | No tasks | `onAddTask`, `onImport` |
| `NoVersions` | No versions | `onCreateVersion` |
| `NoSearchResults` | No search results | `searchQuery`, `onClear` |
| `ErrorState` | Error occurred | `title`, `description`, `onRetry` |

### Hooks

| Hook | Use Case | Returns |
|------|----------|---------|
| `useKeyboardShortcuts` | Keyboard shortcuts | - |
| `useAnnouncer` | Screen reader announcements | `{ announce }` |
| `useIsMobile` | Detect mobile | `boolean` |
| `useSidebarState` | Sidebar state | `{ isOpen, toggle, open, close }` |
| `useTouchGestures` | Touch gestures | `ref` |

---

## ✅ Next Steps

1. **Update Remaining Components**
   - GanttChart
   - VersionHistory
   - TaskCreationForm
   - ShareModal

2. **Test Accessibility**
   - Run with screen reader
   - Test keyboard navigation
   - Check focus indicators

3. **Test Responsive Design**
   - Test on mobile devices
   - Test touch gestures
   - Test different screen sizes

4. **Add More Shortcuts**
   - Component-specific shortcuts
   - Context-sensitive shortcuts

---

## 🎉 You're Ready!

All UX improvement components are created and ready to use. Start integrating them into your components using the patterns above!

```tsx
// Import what you need
import { ProjectListSkeleton } from './components/Loading/LoadingStates'
import { NoProjects } from './components/EmptyStates/EmptyStates'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useIsMobile } from './hooks/useResponsive'
import { useAnnouncer } from './hooks/useAccessibility'

// Use in your components
function MyComponent() {
  const isMobile = useIsMobile()
  const { announce } = useAnnouncer()

  useKeyboardShortcuts({
    shortcuts: createCommonShortcuts({
      onSave: handleSave,
      onNew: handleCreate,
    }),
  })

  if (loading) return <ProjectListSkeleton count={5} />
  if (items.length === 0) return <NoProjects onCreateProject={handleCreate} />

  return <div>{/* Your content */}</div>
}
```

See `UX_IMPROVEMENTS.md` for complete documentation!
