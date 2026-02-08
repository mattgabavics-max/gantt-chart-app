# Share Links Documentation

Complete guide to the share link feature for sharing Gantt chart projects.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Components](#components)
4. [API Integration](#api-integration)
5. [Usage Examples](#usage-examples)
6. [Routing](#routing)
7. [Security Considerations](#security-considerations)
8. [Best Practices](#best-practices)

---

## Overview

The share link feature allows users to share their Gantt chart projects with others via secure, time-limited URLs. Recipients can view (and optionally edit) shared projects without requiring an account.

### Key Capabilities

✅ **Generate Share Links** - Create shareable URLs for any project
✅ **Access Control** - Choose between read-only and editable access
✅ **Expiration Options** - Set links to expire (24h, 7d, 30d, or never)
✅ **Link Management** - View, copy, and revoke existing share links
✅ **Anonymous Access** - View shared projects without authentication
✅ **Copy to Account** - Logged-in users can copy shared projects to their account

---

## Features

### 1. ShareModal Component

A comprehensive modal for creating and managing share links.

**Features:**
- Access type toggle (view-only vs editable)
- Expiration date selector
- One-click link generation
- List of active share links
- Copy link to clipboard
- Revoke link functionality
- Access count and last accessed timestamp

### 2. SharedProjectView Component

Public viewer for accessing shared projects.

**Features:**
- No authentication required
- Banner indicating shared access
- Read-only or editable mode based on permissions
- Task list view with progress indicators
- Option to copy project (for logged-in users)
- Expiration warning
- Invalid/expired link error handling

---

## Components

### ShareModal

Location: `src/components/Share/ShareModal.tsx`

#### Props

```typescript
interface ShareModalProps {
  projectId: string      // ID of the project to share
  projectName: string    // Name of the project (for display)
  isOpen: boolean        // Modal visibility state
  onClose: () => void    // Close handler
}
```

#### Usage

```tsx
import { ShareModal } from '../components/Share'

function ProjectPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowModal(true)}>Share</button>

      <ShareModal
        projectId="project-123"
        projectName="My Project"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
```

### SharedProjectView

Location: `src/components/Share/SharedProjectView.tsx`

This component is used as a route component and doesn't take props. It reads the share token from the URL params.

#### Features

- Automatic token extraction from URL
- Loading states
- Error handling for invalid/expired tokens
- Anonymous user support
- Copy project functionality for authenticated users

---

## API Integration

### Types

```typescript
// Share Link
interface ShareLink {
  id: string
  projectId: string
  token: string
  accessType: 'readonly' | 'editable'
  expiresAt: Date | null
  createdAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
  accessCount: number
  lastAccessedAt: Date | null
}

// Create Request
interface CreateShareLinkRequest {
  projectId: string
  accessType: 'readonly' | 'editable'
  expirationDays?: number // null/undefined for never expires
}

// Shared Project Response
interface SharedProjectResponse {
  project: Project
  tasks: Task[]
  accessType: 'readonly' | 'editable'
  shareLink: {
    id: string
    expiresAt: Date | null
  }
}
```

### API Endpoints

```typescript
// Get all share links for a project
GET /api/projects/:projectId/share-links
Response: { shareLinks: ShareLink[], total: number }

// Create a new share link
POST /api/projects/:projectId/share-links
Body: CreateShareLinkRequest
Response: ShareLink

// Revoke a share link
DELETE /api/projects/:projectId/share-links/:shareLinkId
Response: void

// Get shared project (public endpoint - no auth required)
GET /api/share/:token
Response: SharedProjectResponse

// Update task in shared project (editable only)
PATCH /api/share/:token/tasks/:taskId
Body: UpdateTaskRequest
Response: Task
```

### React Query Hooks

```typescript
import {
  useShareLinks,
  useCreateShareLink,
  useRevokeShareLink,
  useSharedProject,
  useUpdateSharedProjectTask,
} from '../hooks'

// Fetch share links
const { data, isLoading } = useShareLinks(projectId)

// Create share link
const createLink = useCreateShareLink({
  onSuccess: () => console.log('Link created!')
})
createLink.mutate({
  projectId: 'project-123',
  accessType: 'readonly',
  expirationDays: 7
})

// Revoke share link
const revokeLink = useRevokeShareLink()
revokeLink.mutate({ projectId, shareLinkId })

// Get shared project (in SharedProjectView)
const { data: sharedData } = useSharedProject(token)

// Update task in shared project
const updateTask = useUpdateSharedProjectTask()
updateTask.mutate({
  token,
  taskId,
  data: { progress: 75 }
})
```

---

## Usage Examples

### Basic Integration

```tsx
import { useState } from 'react'
import { ShareModal } from '../components/Share'

function ProjectHeader({ projectId, projectName }) {
  const [showShare, setShowShare] = useState(false)

  return (
    <div>
      <h1>{projectName}</h1>
      <button onClick={() => setShowShare(true)}>
        Share Project
      </button>

      <ShareModal
        projectId={projectId}
        projectName={projectName}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </div>
  )
}
```

### With Keyboard Shortcut

```tsx
function ProjectPage({ projectId, projectName }) {
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+S or Cmd+Shift+S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        setShowShare(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <p>Press Ctrl+Shift+S to share</p>
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

### Programmatic Link Creation

```tsx
import { useCreateShareLink } from '../hooks'

function QuickShare({ projectId }) {
  const createLink = useCreateShareLink({
    onSuccess: async (response) => {
      const url = `${window.location.origin}/share/${response.data.token}`
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  })

  const handleQuickShare = () => {
    createLink.mutate({
      projectId,
      accessType: 'readonly',
      expirationDays: 1 // 24 hours
    })
  }

  return (
    <button onClick={handleQuickShare}>
      Quick Share (24h)
    </button>
  )
}
```

---

## Routing

### Route Setup

```tsx
// App.tsx or routes file
import { Routes, Route } from 'react-router-dom'
import { SharedProjectView } from '../components/Share'

function AppRoutes() {
  return (
    <Routes>
      {/* Public route - no auth required */}
      <Route path="/share/:token" element={<SharedProjectView />} />

      {/* Other routes... */}
    </Routes>
  )
}
```

### URL Structure

```
Share link format:
https://yourapp.com/share/abc123xyz789

Token extraction:
const { token } = useParams<{ token: string }>()
```

### Redirect After Login

```tsx
// In SharedProjectView
const handleGoToLogin = () => {
  // Store current URL for redirect after login
  sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
  navigate('/login')
}

// In LoginPage (after successful login)
const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
if (redirectUrl) {
  sessionStorage.removeItem('redirectAfterLogin')
  navigate(redirectUrl)
} else {
  navigate('/dashboard')
}
```

---

## Security Considerations

### 1. Token Generation

**Backend Requirements:**
- Use cryptographically secure random tokens
- Minimum 32 characters
- Unique per share link
- Store hashed in database

```javascript
// Example (backend)
const crypto = require('crypto')
const token = crypto.randomBytes(32).toString('hex')
```

### 2. Access Control

**Implementation:**
- Validate token on every request
- Check expiration date
- Verify access type (readonly vs editable)
- Track access count and last accessed time

### 3. Rate Limiting

**Recommended:**
- Limit share link creation (e.g., 10 per project per hour)
- Limit access attempts (prevent token brute-force)
- Implement CAPTCHA for repeated failed attempts

### 4. Data Exposure

**Best Practices:**
- Never expose sensitive data in shared projects
- Filter out private comments/notes
- Don't show user email addresses (unless necessary)
- Consider watermarking exported data

### 5. Expiration

**Recommendations:**
- Default to 7-day expiration
- Automatically clean up expired links
- Send notification before expiration
- Allow renewal of active links

---

## Best Practices

### 1. User Experience

✅ **DO:**
- Provide clear visual feedback (copied, revoked, etc.)
- Show expiration warnings
- Display access count
- Make copy button prominent

❌ **DON'T:**
- Auto-copy without user action
- Hide expiration information
- Make revoke action too easy (add confirmation)

### 2. Performance

✅ **DO:**
- Use optimistic updates for revoke action
- Cache share link list
- Lazy load shared project data
- Show loading skeletons

❌ **DON'T:**
- Fetch share links on every render
- Load all project data upfront
- Skip error boundaries

### 3. Accessibility

✅ **DO:**
- Provide keyboard shortcuts
- Use semantic HTML
- Add ARIA labels
- Support screen readers
- Ensure color contrast

❌ **DON'T:**
- Rely only on color for status
- Skip focus indicators
- Use icon-only buttons without labels

### 4. Mobile Support

✅ **DO:**
- Use responsive design
- Large touch targets
- Test share on mobile browsers
- Support mobile share API

```tsx
// Mobile share API
if (navigator.share) {
  navigator.share({
    title: projectName,
    url: shareUrl
  })
}
```

### 5. Analytics

Track these events:
- Share link created
- Share link accessed
- Share link copied
- Share link revoked
- Project copied from share
- Conversion from anonymous to registered user

```tsx
// Example analytics
const createLink = useCreateShareLink({
  onSuccess: (response) => {
    analytics.track('share_link_created', {
      projectId,
      accessType: response.data.accessType,
      expirationDays: response.data.expiresAt
        ? daysBetween(new Date(), response.data.expiresAt)
        : null
    })
  }
})
```

---

## Error Handling

### Common Errors

#### 1. Invalid Token
```tsx
if (error?.error?.code === 'INVALID_TOKEN') {
  return (
    <div>
      <h2>Invalid Link</h2>
      <p>This share link is invalid or has been revoked.</p>
    </div>
  )
}
```

#### 2. Expired Link
```tsx
if (error?.error?.code === 'LINK_EXPIRED') {
  return (
    <div>
      <h2>Link Expired</h2>
      <p>This share link has expired.</p>
      {isAuthenticated && (
        <button onClick={requestNewLink}>Request New Link</button>
      )}
    </div>
  )
}
```

#### 3. Permission Denied
```tsx
if (error?.error?.code === 'PERMISSION_DENIED') {
  return (
    <div>
      <h2>Access Denied</h2>
      <p>You don't have permission to edit this project.</p>
    </div>
  )
}
```

---

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ShareModal } from './ShareModal'

describe('ShareModal', () => {
  it('renders when open', () => {
    render(
      <ShareModal
        projectId="123"
        projectName="Test Project"
        isOpen={true}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Share Project')).toBeInTheDocument()
  })

  it('creates share link', async () => {
    const { user } = render(<ShareModal ... />)

    await user.click(screen.getByText('Generate Share Link'))

    expect(screen.getByText(/Link created/i)).toBeInTheDocument()
  })
})
```

### Integration Tests

```tsx
describe('Share Link Flow', () => {
  it('creates and accesses share link', async () => {
    // Create link
    const { token } = await createShareLink({
      projectId: '123',
      accessType: 'readonly',
      expirationDays: 7
    })

    // Access shared project
    const response = await getSharedProject(token)
    expect(response.project.id).toBe('123')
    expect(response.accessType).toBe('readonly')
  })
})
```

---

## Troubleshooting

### Link Not Working

1. Check if link is expired
2. Verify token is correct (no truncation)
3. Check browser console for errors
4. Verify backend is running
5. Check CORS configuration

### Copy to Clipboard Failing

```tsx
// Fallback for older browsers
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    // Fallback
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}
```

### Share Modal Not Opening

1. Check state management
2. Verify modal props
3. Check z-index conflicts
4. Inspect CSS issues

---

## Future Enhancements

- [ ] Email share invitations
- [ ] Password-protected links
- [ ] Custom expiration dates
- [ ] Link usage analytics dashboard
- [ ] Bulk link management
- [ ] QR code generation
- [ ] Embed codes for websites
- [ ] Social media sharing
- [ ] Share templates (common settings presets)
- [ ] Notification when link is accessed

---

For more examples, see `src/examples/ShareLinkExample.tsx`.
