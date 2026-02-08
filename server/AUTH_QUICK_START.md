# Authentication Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create `server/.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/gantt_chart_db"
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Important:** Generate a secure JWT_SECRET for production:
```bash
openssl rand -base64 64
```

### 3. Run Database Migrations

```bash
npm run prisma:migrate
```

### 4. Seed Test Users (Optional)

```bash
npm run prisma:seed
```

Test credentials:
- Email: `john.doe@example.com` | Password: `password123`
- Email: `jane.smith@example.com` | Password: `password123`
- Email: `demo@example.com` | Password: `password123`

### 5. Start Server

```bash
npm run dev
```

Server runs at: http://localhost:5000

---

## 📝 Test the API

### Option 1: Using cURL

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

**Get User (Replace TOKEN):**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option 2: Using Postman

1. Import the endpoints:
   - POST `http://localhost:5000/api/auth/register`
   - POST `http://localhost:5000/api/auth/login`
   - GET `http://localhost:5000/api/auth/me`
   - GET `http://localhost:5000/api/auth/verify`

2. Add token to headers:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN`

### Option 3: Using REST Client (VS Code)

1. Install "REST Client" extension
2. Open `server/tests/auth.test.http`
3. Click "Send Request" above each endpoint

---

## 🔐 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/verify` | Verify token | Yes |

---

## 🛡️ Using Authentication in Routes

### Protect a Route

```typescript
import { authenticate } from './middleware/auth.js'
import { asyncHandler } from './middleware/errorHandler.js'

router.get('/protected', authenticate, asyncHandler(async (req, res) => {
  // req.user is available
  res.json({
    success: true,
    message: 'You are authenticated!',
    user: req.user
  })
}))
```

### Optional Authentication

```typescript
import { optionalAuthenticate } from './middleware/auth.js'

router.get('/public', optionalAuthenticate, asyncHandler(async (req, res) => {
  const message = req.user
    ? `Welcome back, ${req.user.email}!`
    : 'Welcome, guest!'

  res.json({ success: true, message })
}))
```

---

## 🎨 Frontend Integration

### React Example

```typescript
// authService.ts
const API_URL = 'http://localhost:5000/api/auth'

export async function register(email: string, password: string) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.message)
  }

  localStorage.setItem('token', data.data.token)
  return data.data.user
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.message)
  }

  localStorage.setItem('token', data.data.token)
  return data.data.user
}

export function logout() {
  localStorage.removeItem('token')
}

export function getToken() {
  return localStorage.getItem('token')
}
```

### Axios Setup

```typescript
// api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// Add token to requests
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

## ⚙️ Configuration

### Rate Limiting

**Auth endpoints** (register/login): 5 requests / 15 minutes
**Other endpoints**: 100 requests / 15 minutes

Adjust in `server/src/routes/auth.routes.ts`

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Customize in `server/src/validators/auth.validator.ts`

### Token Expiration

Default: 7 days

Change in `.env`:
```env
JWT_EXPIRES_IN=7d  # or 24h, 1m, 60s
```

---

## 🐛 Common Issues

### "Token has expired"
- Token lifetime is 7 days by default
- User needs to login again
- Consider implementing refresh tokens

### "User not found"
- User was deleted from database
- Token is for non-existent user
- Clear token and re-authenticate

### "Too many requests"
- Rate limit reached (5 attempts per 15 min)
- Wait 15 minutes or adjust rate limits
- Check for API abuse

### "Invalid token"
- Token format is incorrect
- Must be: `Bearer <token>`
- JWT_SECRET may have changed

---

## 📚 Full Documentation

See `server/AUTHENTICATION.md` for complete documentation including:
- Detailed API reference
- Security best practices
- Error handling
- TypeScript types
- Advanced usage

---

## ✅ Checklist

- [ ] Environment variables configured
- [ ] Database migrated
- [ ] JWT_SECRET set (production-ready)
- [ ] Server running
- [ ] Tested registration endpoint
- [ ] Tested login endpoint
- [ ] Tested protected routes
- [ ] Frontend integration complete

---

## 🎯 Next Steps

1. ✅ Basic authentication working
2. Implement password reset
3. Add email verification
4. Add refresh tokens
5. Add OAuth providers
6. Implement 2FA

Happy coding! 🚀
