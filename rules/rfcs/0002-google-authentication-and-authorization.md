- Start Date: 2025-01-27
- Members: Development Team
- RFC PR: (leave this empty)

# Summary

This RFC proposes implementing Google OAuth 2.0 authentication for the Gecko SaaS MVP, including both backend and frontend components. The proposal includes a complete authentication flow with JWT-based sessions, role-based access control (RBAC) with permissions, and protected routes. This implementation will enable users to sign in with their Google accounts and access the application based on their assigned roles (ADMIN, WORKER) and specific permissions.

# Basic example

```typescript
// Frontend: Login component usage
<GoogleLoginButton />
// After successful login, user is redirected to dashboard with role-based access

// Backend: Protected route example
router.get('/api/activities', authenticateToken, requirePermission('activities:read'), getActivities);

// Frontend: Protected route with role check
<Route 
  path="/billing" 
  element={<RequireAuth requiredRole="ADMIN"><BillingPage /></RequireAuth>} 
/>
```

# Motivation

Currently, the Gecko application lacks authentication and authorization mechanisms. We need to:

1. **Secure the application**: Prevent unauthorized access to sensitive data (activities, billing, client information)
2. **User identification**: Track which user performs actions (important for audit trails and activity assignment)
3. **Role-based access**: Differentiate between ADMIN and WORKER roles with appropriate permissions
4. **Seamless user experience**: Google OAuth provides a familiar, passwordless login experience
5. **Compliance**: Ensure only authorized personnel can access billing and financial data
6. **Audit requirements**: Link all actions to authenticated users for accountability

The expected outcome is a secure, role-aware application where:
- Users authenticate via Google OAuth
- Admins have full access to all features (dashboard, activities, billing, workers, clients)
- Workers have limited access (view assigned activities, update activity status, view their own payouts)
- All API endpoints are protected and validate user permissions
- Frontend routes are protected based on user roles

# Detailed design

## 1. Database Schema Updates

### 1.1 User Model Extensions

Extend the existing User model in Prisma schema:

```prisma
model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  role          UserRole  @default(WORKER)
  googleId      String?   @unique  // Google OAuth ID
  picture       String?   // Google profile picture URL
  hourlyRate    Float?
  specialty     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  activities    Activity[]
  invoices      Invoice[]  // Worker payouts
  
  // Authentication
  sessions      Session[]
  refreshTokens RefreshToken[]
  
  @@index([email])
  @@index([googleId])
}

enum UserRole {
  ADMIN
  WORKER
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
}
```

### 1.2 Permission System

Create a permissions table for fine-grained access control:

```prisma
model Permission {
  id          String   @id @default(uuid())
  name        String   @unique  // e.g., "activities:read", "billing:create"
  description String?
  createdAt   DateTime @default(now())
  
  rolePermissions RolePermission[]
}

model RolePermission {
  id           String   @id @default(uuid())
  role         UserRole
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([role, permissionId])
  @@index([role])
}

// Seed data for permissions
// ADMIN permissions:
// - activities:read, activities:create, activities:update, activities:delete
// - billing:read, billing:create, billing:update
// - workers:read, workers:create, workers:update, workers:delete
// - clients:read, clients:create, clients:update, clients:delete
// - dashboard:read
// - calendar:read
//
// WORKER permissions:
// - activities:read (own), activities:update (own status)
// - payouts:read (own)
// - calendar:read (own)
```

## 2. Backend Implementation

### 2.1 Dependencies

Add to `backend/package.json`:

```json
{
  "dependencies": {
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "express-session": "^1.18.0",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5"
  }
}
```

### 2.2 Authentication Middleware

Create `backend/middleware/auth.js`:

```javascript
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware to authenticate JWT token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        picture: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Middleware to check user role
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Middleware to check specific permission
async function requirePermission(permissionName) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = await prisma.rolePermission.findFirst({
      where: {
        role: req.user.role,
        permission: {
          name: permissionName,
        },
      },
    });

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
};
```

### 2.3 Google OAuth Strategy

Create `backend/config/passport.js`:

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (user) {
          // Update user info if needed
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: profile.displayName,
              email: profile.emails[0].value,
              picture: profile.photos[0]?.value,
            },
          });
        } else {
          // Check if user exists by email (for migration)
          user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value },
          });

          if (user) {
            // Link Google account to existing user
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                picture: profile.photos[0]?.value,
              },
            });
          } else {
            // Create new user with WORKER role by default
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                picture: profile.photos[0]?.value,
                role: 'WORKER', // Default role, admins can be promoted manually
              },
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        picture: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
```

### 2.4 Authentication Routes

Create `backend/routes/auth.js`:

```javascript
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Google OAuth login initiation
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate JWT access token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(
        `${frontendUrl}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
  }
);

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        picture: true,
        specialty: true,
        hourlyRate: true,
      },
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
```

### 2.5 Environment Variables

Add to `backend/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 2.6 Update Main App

Update `backend/app.js` to include auth routes:

```javascript
// ... existing code ...
const authRoutes = require('./routes/auth');

// ... existing middleware ...
app.use('/api/auth', authRoutes);

// Protect all API routes (except auth)
app.use('/api', authenticateToken);
```

## 3. Frontend Implementation

### 3.1 Dependencies

Add to `frontend/package.json`:

```json
{
  "dependencies": {
    "@react-oauth/google": "^0.12.0"
  }
}
```

### 3.2 Authentication Context

Create `frontend/app/contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'WORKER';
  picture?: string;
  specialty?: string;
  hourlyRate?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: 'ADMIN' | 'WORKER') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Permission mapping (can be fetched from API in the future)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'activities:read',
    'activities:create',
    'activities:update',
    'activities:delete',
    'billing:read',
    'billing:create',
    'billing:update',
    'workers:read',
    'workers:create',
    'workers:update',
    'workers:delete',
    'clients:read',
    'clients:create',
    'clients:update',
    'clients:delete',
    'dashboard:read',
    'calendar:read',
  ],
  WORKER: [
    'activities:read',
    'activities:update', // Only own activities
    'payouts:read', // Only own payouts
    'calendar:read', // Only own calendar
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else if (storedRefreshToken) {
      // Try to refresh token
      refreshAccessToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token invalid, try refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          await refreshAccessToken();
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        await fetchUser(data.accessToken);
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
  };

  const login = (accessToken: string, refreshToken: string) => {
    setToken(accessToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    fetchUser(accessToken);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  const hasRole = (role: 'ADMIN' | 'WORKER'): boolean => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshAccessToken,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3.3 Login Component

Create `frontend/app/routes/login.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '~/contexts/AuthContext';
import { Button } from '~/components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();

  useEffect(() => {
    // Handle OAuth callback
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (token && refreshToken) {
      login(token, refreshToken);
      navigate('/dashboard');
    } else if (error) {
      console.error('Login error:', error);
    }

    // If already logged in, redirect to dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [searchParams, login, user, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Gecko
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Contractor Risk Management Platform
          </p>
        </div>
        <div className="mt-8">
          <Button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 3.4 Protected Route Component

Create `frontend/app/components/auth/RequireAuth.tsx`:

```typescript
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '~/contexts/AuthContext';

interface RequireAuthProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'WORKER';
  requiredPermission?: string;
}

export function RequireAuth({
  children,
  requiredRole,
  requiredPermission,
}: RequireAuthProps) {
  const { user, isLoading, hasRole, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You don't have the required permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

### 3.5 API Client with Auth

Update `frontend/app/lib/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
}

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem('accessToken', data.accessToken);
        // Retry original request
        return apiRequest(endpoint, options);
      }
    }
    // Refresh failed, redirect to login
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  return response;
}

export async function getActivities(filters?: Record<string, string>) {
  const response = await apiRequest(
    `/activities?${new URLSearchParams(filters || {})}`
  );
  return response.json();
}

// ... other API functions
```

### 3.6 Update Root Component

Update `frontend/app/root.tsx` to include AuthProvider:

```typescript
import { AuthProvider } from './contexts/AuthContext';

export default function Root() {
  return (
    <html>
      <head>
        {/* ... existing head content ... */}
      </head>
      <body>
        <AuthProvider>
          {/* ... existing content ... */}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3.7 Update Routes

Add login route and protect existing routes in `frontend/app/routes.ts`:

```typescript
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("auth/callback", "routes/auth-callback.tsx"),
  layout("routes/_layout.tsx", [
    index("routes/dashboard.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    // ... other protected routes
  ]),
] satisfies RouteConfig;
```

## 4. Permission System Details

### 4.1 Permission Definitions

| Permission | Description | ADMIN | WORKER |
|------------|-------------|-------|--------|
| `activities:read` | View activities | ✅ | ✅ (own only) |
| `activities:create` | Create new activities | ✅ | ❌ |
| `activities:update` | Update activities | ✅ | ✅ (own status only) |
| `activities:delete` | Delete activities | ✅ | ❌ |
| `billing:read` | View invoices/payouts | ✅ | ✅ (own payouts only) |
| `billing:create` | Generate invoices | ✅ | ❌ |
| `billing:update` | Update invoices | ✅ | ❌ |
| `workers:read` | View workers list | ✅ | ❌ |
| `workers:create` | Add new workers | ✅ | ❌ |
| `workers:update` | Edit worker info | ✅ | ❌ |
| `workers:delete` | Remove workers | ✅ | ❌ |
| `clients:read` | View clients | ✅ | ❌ |
| `clients:create` | Add new clients | ✅ | ❌ |
| `clients:update` | Edit client info | ✅ | ❌ |
| `clients:delete` | Remove clients | ✅ | ❌ |
| `dashboard:read` | View dashboard | ✅ | ❌ |
| `calendar:read` | View calendar | ✅ | ✅ (own only) |

### 4.2 Resource-Level Permissions

For WORKER role, additional checks are needed:

- **Own activities**: Activities where `workerId === currentUser.id`
- **Own payouts**: Invoices where `type === 'WORKER_PAYOUT'` AND `entityId === currentUser.id`
- **Own calendar**: Calendar events filtered by `workerId === currentUser.id`

These checks should be implemented in backend endpoints, not just frontend.

## 5. Migration Strategy

### 5.1 Database Migration

1. Run Prisma migration to add new fields and tables
2. Seed permissions and role-permission mappings
3. For existing users without `googleId`, they can link their account on first login

### 5.2 Backend Migration

1. Add authentication middleware to all existing routes
2. Update route handlers to use `req.user` instead of hardcoded user IDs
3. Add permission checks to sensitive operations

### 5.3 Frontend Migration

1. Wrap existing routes with `RequireAuth` component
2. Update API calls to include authentication headers
3. Add role-based UI elements (hide/show based on permissions)

# Drawbacks

1. **Google OAuth dependency**: Application requires Google account, which may not be suitable for all users. However, this can be extended to support other OAuth providers or email/password in the future.

2. **JWT token management**: JWT tokens are stateless but require careful handling of refresh tokens. The current implementation stores refresh tokens in the database for revocation capability.

3. **Permission system complexity**: Fine-grained permissions add complexity. For MVP, role-based checks might be sufficient, but the permission system allows for future flexibility.

4. **Session management**: Current implementation uses JWT with refresh tokens. Alternative approaches (server-side sessions) could be considered for better control.

5. **Frontend token storage**: Storing tokens in localStorage is vulnerable to XSS attacks. Consider httpOnly cookies for production, though this requires CORS configuration.

6. **Migration overhead**: Existing API endpoints need to be updated to include authentication, which requires careful testing.

# Alternatives

1. **Email/Password authentication**: Rejected for MVP to reduce password management overhead and improve security (no password leaks).

2. **Multiple OAuth providers**: Deferred to V2. Can add Microsoft, GitHub, etc. later using the same pattern.

3. **Server-side sessions**: Considered but rejected for MVP to keep stateless architecture. Can be migrated later if needed.

4. **Role-only permissions (no fine-grained)**: Considered but rejected. Fine-grained permissions allow for future role expansion (e.g., MANAGER, CLIENT roles).

5. **OAuth with session cookies**: Considered but requires more complex CORS setup. JWT approach is simpler for MVP.

# Adoption strategy

1. **Phase 1: Backend Setup**
   - Set up Google OAuth credentials
   - Implement authentication routes and middleware
   - Update database schema
   - Seed permissions

2. **Phase 2: Frontend Integration**
   - Create AuthContext and login component
   - Add protected route wrapper
   - Update API client with authentication

3. **Phase 3: Route Protection**
   - Wrap existing routes with `RequireAuth`
   - Add role-based UI elements
   - Update backend routes to use authentication middleware

4. **Phase 4: Testing & Refinement**
   - Test login flow end-to-end
   - Verify permission checks
   - Test token refresh mechanism
   - Security audit

**Migration path:**
- No breaking changes to existing data models (only additions)
- Existing routes can be gradually protected
- Users can continue using the app while authentication is being rolled out (if deployed incrementally)

**Coordination:**
- Google OAuth credentials must be configured in both development and production environments
- Frontend and backend environment variables must be synchronized
- Database migrations must be run before deploying authentication features

# How we teach this

**Terminology:**
- **OAuth 2.0**: Industry-standard authorization protocol
- **JWT (JSON Web Token)**: Stateless authentication token
- **Refresh Token**: Long-lived token used to obtain new access tokens
- **RBAC (Role-Based Access Control)**: Permission system based on user roles
- **Protected Route**: Route that requires authentication
- **Permission**: Fine-grained access control (e.g., `activities:read`)

**Presentation:**
- This RFC should be presented as the foundation for all security in the application
- Emphasize that all API endpoints must be protected
- Show the authentication flow diagram (Google → Backend → JWT → Frontend)
- Demonstrate how to add permission checks to new features

**Documentation updates:**
- Add authentication section to README
- Document environment variables required
- Create guide for adding new permissions
- Document how to test authentication locally

**Developer onboarding:**
- New developers must understand the authentication flow before working on features
- Show how to use `RequireAuth` component
- Demonstrate how to check permissions in components
- Explain how to add permission checks to backend routes

# Unresolved questions

1. **Token refresh strategy**: Should we implement automatic token refresh in the background, or only on 401 responses? (Current implementation: on 401)

2. **Admin promotion**: How should users be promoted to ADMIN role? Manual database update, or should we add an admin interface? (Recommendation: Manual for MVP, admin interface in V2)

3. **Account linking**: If a user has an existing account (by email) and logs in with Google for the first time, should we automatically link or require confirmation? (Current: Auto-link)

4. **Session timeout**: What should be the access token expiration time? (Current: 15 minutes, configurable)

5. **Multi-device sessions**: Should users be able to have multiple active sessions? (Current: Yes, each device gets its own refresh token)

6. **Permission caching**: Should permissions be cached on the frontend, or fetched from API? (Current: Hardcoded mapping, can be moved to API)

7. **Audit logging**: Should we log all authentication events (login, logout, token refresh) for security auditing? (Recommendation: Yes, add to V2)

8. **Password reset flow**: Since we're using Google OAuth, do we need a password reset? (No, but we may need account recovery for locked accounts)

9. **Email verification**: Should we verify email addresses from Google, or trust Google's verification? (Current: Trust Google)

10. **Rate limiting**: Should we implement rate limiting on authentication endpoints to prevent brute force? (Recommendation: Yes, add to production deployment)

