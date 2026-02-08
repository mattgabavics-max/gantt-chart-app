# Share Links Setup Guide

Quick setup guide for the share link feature.

## 📁 Files Created

### 1. Type Definitions
- **`src/types/api.ts`** - Added share link types
  - `ShareLink` interface
  - `CreateShareLinkRequest` interface
  - `ShareLinkListResponse` interface
  - `SharedProjectResponse` interface
  - `RevokeShareLinkRequest` interface

### 2. API Client
- **`src/services/api.ts`** - Added share link endpoints
  - `getShareLinks()` - Get all share links for a project
  - `createShareLink()` - Create new share link
  - `revokeShareLink()` - Revoke a share link
  - `getSharedProject()` - Get shared project (public endpoint)
  - `updateSharedProjectTask()` - Update task in editable shared project

### 3. React Query Hooks
- **`src/hooks/useQueryHooks.ts`** - Added share link hooks
  - `useShareLinks` - Query for fetching share links
  - `useSharedProject` - Query for fetching shared project
  - `useCreateShareLink` - Mutation for creating share links
  - `useRevokeShareLink` - Mutation for revoking share links (with optimistic updates)
  - `useUpdateSharedProjectTask` - Mutation for updating shared project tasks

- **`src/hooks/index.ts`** - Export share link hooks

### 4. Components

#### ShareModal
- **`src/components/Share/ShareModal.tsx`** - Share link management modal
  - Access type toggle (readonly/editable)
  - Expiration options (24h, 7d, 30d, never)
  - Generate link button
  - List of active share links
  - Copy link to clipboard
  - Revoke link functionality
  - Access count tracking
  - Expired link highlighting

#### SharedProjectView
- **`src/components/Share/SharedProjectView.tsx`** - Public project viewer
  - No authentication required
  - Token extraction from URL
  - Read-only or editable mode
  - Anonymous user support
  - Banner indicating shared access
  - Expiration warnings
  - Copy project functionality (for logged-in users)
  - Task list view
  - Error handling for invalid/expired tokens

#### Index
- **`src/components/Share/index.ts`** - Export share components

### 5. Routing
- **`src/routes/AppRoutes.tsx`** - Route configuration example
  - `/share/:token` route for shared projects
  - Protected routes setup
  - 404 handling

### 6. Examples
- **`src/examples/ShareLinkExample.tsx`** - Usage examples
  - Basic share button integration
  - Keyboard shortcut support
  - Dropdown menu integration
  - Programmatic link creation
  - Complete integration example

### 7. Tests
- **`src/components/Share/ShareModal.test.tsx`** - Unit tests
  - Rendering tests
  - Share link creation
  - Copy functionality
  - Revoke functionality
  - Error handling

### 8. Documentation
- **`SHARE_LINKS.md`** - Comprehensive documentation
  - Feature overview
  - API integration details
  - Usage examples
  - Security considerations
  - Best practices
  - Troubleshooting guide

- **`SHARE_LINKS_SETUP.md`** - This file (quick setup guide)

---

## 🚀 Quick Start

### 1. Import Components

```tsx
import { ShareModal } from './components/Share'
```

### 2. Add Share Button

```tsx
function ProjectPage({ projectId, projectName }) {
  const [showShare, setShowShare] = useState(false)

  return (
    <>
      <button onClick={() => setShowShare(true)}>
        Share Project
      </button>

      <ShareModal
        projectId={projectId}
        projectName={projectName}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </>
  )
}
```

### 3. Add Routing

```tsx
// In your main App.tsx or routes file
import { Routes, Route } from 'react-router-dom'
import { SharedProjectView } from './components/Share'

<Routes>
  <Route path="/share/:token" element={<SharedProjectView />} />
  {/* Other routes... */}
</Routes>
```

### 4. Backend Requirements

Your backend needs to implement these endpoints:

```
GET    /api/projects/:projectId/share-links
POST   /api/projects/:projectId/share-links
DELETE /api/projects/:projectId/share-links/:shareLinkId
GET    /api/share/:token
PATCH  /api/share/:token/tasks/:taskId
```

---

## 🎯 Features

### ShareModal Features
✅ Create share links with custom settings
✅ Choose between view-only and editable access
✅ Set expiration (24h, 7d, 30d, or never)
✅ View all active share links
✅ Copy links to clipboard
✅ Revoke links with confirmation
✅ See access count and last accessed time
✅ Highlight expired links

### SharedProjectView Features
✅ Access shared projects without login
✅ Banner indicating shared access type
✅ Expiration warnings
✅ Read-only or editable mode
✅ Task list view with progress
✅ Copy project to account (logged-in users)
✅ Error handling for invalid/expired tokens
✅ Loading states
✅ Mobile responsive

---

## 📊 Data Flow

### Creating a Share Link

```
User clicks "Share" button
  ↓
ShareModal opens
  ↓
User selects access type & expiration
  ↓
User clicks "Generate Share Link"
  ↓
useCreateShareLink mutation
  ↓
POST /api/projects/:projectId/share-links
  ↓
Backend generates token & creates link
  ↓
Link appears in modal
  ↓
User clicks "Copy"
  ↓
Link copied to clipboard
```

### Accessing a Shared Link

```
User visits /share/:token
  ↓
SharedProjectView renders
  ↓
useSharedProject query
  ↓
GET /api/share/:token
  ↓
Backend validates token & expiration
  ↓
Returns project, tasks, and access type
  ↓
SharedProjectView displays project
  ↓
If editable: User can modify tasks
  ↓
useUpdateSharedProjectTask mutation
  ↓
PATCH /api/share/:token/tasks/:taskId
```

---

## 🔒 Security Checklist

### Frontend
- [x] No sensitive data in share link URLs
- [x] Token validation on every request
- [x] Expiration warnings displayed
- [x] Copy confirmation to prevent accidents
- [x] Revoke confirmation dialog

### Backend (Required)
- [ ] Cryptographically secure token generation
- [ ] Token hashing in database
- [ ] Expiration date validation
- [ ] Access type enforcement (readonly vs editable)
- [ ] Rate limiting on link creation
- [ ] Access logging
- [ ] Automatic cleanup of expired links

---

## 🎨 Customization

### Change Default Expiration

```tsx
// In ShareModal.tsx
const [expiration, setExpiration] = useState<ExpirationOption>('30d') // Changed from '7d'
```

### Add Custom Expiration Options

```tsx
// In ShareModal.tsx
const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 hour', days: 1/24 },
  { value: '24h', label: '24 hours', days: 1 },
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: '90d', label: '90 days', days: 90 },
  { value: 'never', label: 'Never expires', days: null },
]
```

### Customize Banner Colors

```tsx
// In SharedProjectView.tsx
<div className={`${
  isReadonly
    ? 'bg-purple-600'  // Changed from blue-600
    : 'bg-orange-600'  // Changed from green-600
} text-white px-4 py-3`}>
```

### Add Custom Analytics

```tsx
// In ShareModal.tsx
const handleCopyLink = async (shareLink: ShareLink) => {
  // ... existing copy logic ...

  // Track copy event
  analytics.track('share_link_copied', {
    projectId,
    shareLinkId: shareLink.id,
    accessType: shareLink.accessType
  })
}
```

---

## 🐛 Troubleshooting

### Share Modal Not Opening
```tsx
// Check state is updating
console.log('showShare:', showShare)

// Check modal props
<ShareModal
  projectId={projectId}  // Must be valid string
  projectName={projectName}  // Must be valid string
  isOpen={showShare}  // Must be true
  onClose={() => setShowShare(false)}  // Must be function
/>
```

### Links Not Loading
```tsx
// Check React Query DevTools
// Verify API endpoint is correct
// Check network tab in browser
// Verify token is in URL params
```

### Copy to Clipboard Failing
```tsx
// Check browser permissions
// Use fallback for older browsers (included in ShareModal)
// Test with HTTPS (required for clipboard API)
```

### Expired Links Not Showing
```tsx
// Check date comparison logic
// Verify backend returns expiresAt as Date
// Check timezone handling
```

---

## 📝 Next Steps

1. **Backend Implementation**
   - Implement share link endpoints
   - Add token generation
   - Set up expiration handling
   - Add access logging

2. **Testing**
   - Run existing unit tests
   - Add integration tests
   - Test on mobile devices
   - Test different browsers

3. **Enhancement Ideas**
   - Email share invitations
   - Password-protected links
   - Custom branding for shared views
   - QR code generation
   - Analytics dashboard

4. **Production Checklist**
   - Enable HTTPS
   - Configure CORS
   - Set up rate limiting
   - Add monitoring
   - Test error scenarios

---

## 📚 Resources

- **Full Documentation**: `SHARE_LINKS.md`
- **Usage Examples**: `src/examples/ShareLinkExample.tsx`
- **Component Code**: `src/components/Share/`
- **API Hooks**: `src/hooks/useQueryHooks.ts`
- **Tests**: `src/components/Share/ShareModal.test.tsx`

---

## 💡 Tips

1. **Test expiration dates** - Create links with short expirations for testing
2. **Use browser DevTools** - React Query DevTools shows query state
3. **Check network tab** - Verify API calls are working
4. **Mobile testing** - Test share functionality on mobile devices
5. **Error handling** - Test with invalid tokens to verify error states

---

## 🎉 You're Ready!

The share link feature is fully implemented and ready to use. Just add a share button to your project page and you're good to go!

```tsx
import { ShareModal } from './components/Share'
const [showShare, setShowShare] = useState(false)

<button onClick={() => setShowShare(true)}>Share</button>
<ShareModal {...props} isOpen={showShare} onClose={...} />
```

For more details, see `SHARE_LINKS.md`.
