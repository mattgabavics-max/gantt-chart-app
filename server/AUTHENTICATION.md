# Authentication System Documentation

## Overview

This authentication system provides secure user registration, login, and JWT-based authentication for the Gantt Chart application.

## Features

✅ **User Registration** with email validation
✅ **User Login** with credential verification
✅ **JWT Token Generation** and verification
✅ **Password Hashing** with bcrypt (10 rounds)
✅ **Input Validation** using express-validator
✅ **Rate Limiting** to prevent brute force attacks
✅ **Error Handling** with custom error types
✅ **Authentication Middleware** for protected routes
✅ **Optional Authentication** for public/private content
✅ **TypeScript Support** with full type safety

---

## API Endpoints

### 1. Register User

**POST** `/api/auth/register`

Create a new user account.

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules:**
- Email: Required, valid email format, max 255 characters
- Password: Required, min 8 characters, must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

400 - Validation Error:
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Please check your input",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

409 - Conflict (User exists):
```json
{
  "success": false,
  "error": "A user with this email already exists"
}
```

429 - Rate Limit Exceeded:
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many authentication attempts. Please try again later."
}
```

---

### 2. Login User

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

401 - Unauthorized:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 3. Get Current User

**GET** `/api/auth/me`

Get authenticated user's information.

**Rate Limit:** 100 requests per 15 minutes per IP

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

401 - Unauthorized:
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "No token provided"
}
```

---

### 4. Verify Token

**GET** `/api/auth/verify`

Verify if a JWT token is valid.

**Rate Limit:** 100 requests per 15 minutes per IP

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

---

## Middleware Usage

### 1. Required Authentication

Protect routes that require authentication:

```typescript
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

router.get('/projects', authenticate, asyncHandler(async (req, res) => {
  // req.user is available here
  const projects = await prisma.project.findMany({
    where: { ownerId: req.user!.id }
  })

  res.json({ success: true, data: { projects } })
}))
```

### 2. Optional Authentication

Allow both authenticated and anonymous access:

```typescript
import { optionalAuthenticate } from '../middleware/auth.js'

router.get('/projects/public', optionalAuthenticate, asyncHandler(async (req, res) => {
  // req.user is available if authenticated, undefined otherwise
  const where = req.user
    ? { OR: [{ isPublic: true }, { ownerId: req.user.id }] }
    : { isPublic: true }

  const projects = await prisma.project.findMany({ where })

  res.json({ success: true, data: { projects } })
}))
```

### 3. Ownership Verification

Ensure user owns a resource:

```typescript
import { authenticate, requireOwnership } from '../middleware/auth.js'

router.delete(
  '/projects/:id',
  authenticate,
  requireOwnership('ownerId'),
  asyncHandler(async (req, res) => {
    // User is verified as owner
    await prisma.project.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true, message: 'Project deleted' })
  })
)
```

---

## Client-Side Usage

### Frontend Examples

#### 1. Register

```typescript
async function register(email: string, password: string) {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (data.success) {
    // Store token
    localStorage.setItem('token', data.data.token)
    return data.data.user
  } else {
    throw new Error(data.message)
  }
}
```

#### 2. Login

```typescript
async function login(email: string, password: string) {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (data.success) {
    localStorage.setItem('token', data.data.token)
    return data.data.user
  } else {
    throw new Error(data.message)
  }
}
```

#### 3. Authenticated Request

```typescript
async function getProjects() {
  const token = localStorage.getItem('token')

  const response = await fetch('http://localhost:5000/api/projects', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json()
  return data.data.projects
}
```

#### 4. Axios Interceptor

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## Security Best Practices

### 1. JWT Secret

**Development:**
```env
JWT_SECRET=your-secret-key-change-in-production
```

**Production:**
Generate a cryptographically secure secret:
```bash
openssl rand -base64 64
```

### 2. Token Storage

**Client-Side:**
- ✅ Store in `httpOnly` cookies (most secure)
- ⚠️ Store in `localStorage` (vulnerable to XSS)
- ❌ Never store in `sessionStorage` for long-lived tokens

### 3. Password Requirements

Current requirements (enforced by validation):
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Customize in:** `server/src/validators/auth.validator.ts`

### 4. Rate Limiting

Current limits:
- Auth endpoints (login/register): 5 requests / 15 minutes
- Other auth endpoints: 100 requests / 15 minutes

**Adjust in:** `server/src/routes/auth.routes.ts`

---

## Error Handling

All errors follow a consistent format:

```typescript
{
  success: false,
  error: string,      // Error type/title
  message: string,    // Human-readable message
  errors?: Array<{    // Validation errors (optional)
    field: string,
    message: string
  }>
}
```

### Common Error Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already registered |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server issue |

---

## Testing

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

**Get Current User:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Credentials

After running `npm run prisma:seed`:

```
Email: john.doe@example.com
Email: jane.smith@example.com
Email: demo@example.com
Password: password123
```

---

## Configuration

### Environment Variables

Required in `server/.env`:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/gantt_chart_db"
```

### Customization

**Token Expiration:**
- Edit `JWT_EXPIRES_IN` in `.env`
- Valid formats: `7d`, `24h`, `1m`, `60s`

**Password Policy:**
- Edit `server/src/validators/auth.validator.ts`
- Edit `server/src/utils/password.ts`

**Rate Limits:**
- Edit `server/src/routes/auth.routes.ts`

---

## TypeScript Types

### Request with User

```typescript
import { Request } from 'express'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}
```

### JWT Payload

```typescript
interface JwtPayload {
  userId: string
  email: string
}
```

### Auth Response

```typescript
interface AuthResponse {
  success: true
  message: string
  data: {
    user: {
      id: string
      email: string
      createdAt: Date
    }
    token: string
  }
}
```

---

## Troubleshooting

### "Invalid token" error

- Token may be expired (default: 7 days)
- Token format incorrect (must be `Bearer <token>`)
- JWT_SECRET changed after token was issued

### Rate limit reached

- Wait 15 minutes
- Use different IP address
- Adjust rate limits in code

### Password validation fails

- Check password meets all requirements
- Ensure no extra whitespace
- Verify minimum length (8 characters)

---

## Next Steps

1. ✅ Authentication system implemented
2. 🔄 Implement password reset flow
3. 🔄 Add email verification
4. 🔄 Implement refresh tokens
5. 🔄 Add OAuth providers (Google, GitHub)
6. 🔄 Add two-factor authentication (2FA)

---

## Support

For issues or questions:
- Check error messages in console
- Review validation errors in response
- Verify environment variables are set
- Check database connection
