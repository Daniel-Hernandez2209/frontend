# ATHENA Brand - Admin Dashboard Frontend 🚀

Professional admin dashboard built with **Angular 21**, **Tailwind CSS v3**, and **WebSockets** for real-time updates.

## Project Status: Phase 1 Complete ✅

**Phase 1: Project Setup & Core Infrastructure** 
- ✅ Angular 21 project bootstrapped
- ✅ Tailwind v3 configured (feature-based)
- ✅ Core services implemented (Auth, API, WebSocket)
- ✅ Authentication system with JWT + sessionStorage
- ✅ HTTP interceptors (JWT + error handling)
- ✅ Route guards (authGuard, adminGuard)
- ✅ WebSocket real-time integration (Socket.io)
- ✅ Placeholder pages (Login, Profile, Dashboard)
- ✅ Build passing - 0 errors

**Next Phase: Module Implementation (Products, Orders, Categories, Users)**

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Angular** | 21.2.6 | Frontend framework (SPA) |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **Socket.io** | 4.7.0 | Real-time WebSocket communication |
| **RxJS** | 7.8.0 | Reactive programming |
| **Signals** | Native | Angular 19+ state management (no RxJS observables) |
| **TypeScript** | 5.9.2 | Language |
| **date-fns** | 3.0.0 | Date utilities |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm 10+
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
# or: ng serve --open

# Navigate to: http://localhost:4200
```

### Build for Production

```bash
# Build optimized bundle
npm run build
# Output: dist/frontend/

# Serve production build locally
cd dist/frontend && python -m http.server 3000
```

---

## 📁 Project Structure (Feature-Based)

```
src/
├── app/
│   ├── core/                          # Singleton services, guards, interceptors
│   │   ├── services/
│   │   │   ├── auth.service.ts        # JWT + user state (Signals)
│   │   │   ├── api.service.ts         # HTTP wrapper + error handling
│   │   │   └── websocket.service.ts   # Socket.io real-time events
│   │   ├── guards/
│   │   │   └── auth.guard.ts          # authGuard, adminGuard
│   │   └── interceptors/
│   │       └── jwt.interceptor.ts     # Authorization header + token refresh
│   │
│   ├── features/                       # Feature modules (lazy-loaded)
│   │   ├── auth/                       # Login, logout, profile, password
│   │   ├── dashboard/                  # Analytics, real-time stats (via WebSocket)
│   │   ├── products/                   # CRUD + image upload (FormData)
│   │   ├── orders/                     # Real-time order tracking via WebSocket
│   │   ├── categories/                 # CRUD categories + subcategories
│   │   └── users/                      # User management (admin only)
│   │
│   ├── shared/                         # Reusable components, pipes, types
│   │   ├── components/                 # (navbar, sidebar, pagination, etc.)
│   │   ├── pipes/                      # (currency, date formatting)
│   │   ├── types/
│   │   │   └── interfaces.ts           # TS interfaces for API responses
│   │   └── pages/                      # 403, 404 error pages
│   │
│   ├── layout/                         # Admin layout wrapper
│   │   └── admin-layout/
│   │
│   └── app-routing/    
│       ├── app.routes.ts               # Lazy-loaded feature routes
│       └── app.config.ts               # HTTP interceptors, providers
│
├── environments/                        # Environment configuration
│   ├── environment.ts                  # Dev: localhost:3000
│   └── environment.prod.ts             # Prod: https://api.athenabrand.co
│
├── styles.css                          # Global Tailwind + app styles
├── index.html                          # SPA entry point
└── main.ts                             # Bootstrap app
```

---

## 🔐 Authentication Flow

1. **Login Page** → User enters credentials
2. **AuthService** → POST `/api/auth/login` → JWT tokens returned
3. **SessionStorage** → access_token + refresh_token stored
4. **HTTP Interceptor** → Adds `Authorization: Bearer {token}` to all requests
5. **Token Refresh** → On 401, auto-refresh tokens (seamless re-authentication)
6. **Protected Routes** → authGuard checks public routes before entering dashboard
7. **Admin Routes** → adminGuard checks role === 'admin' before accessing admin features

---

## 📱 WebSocket (Real-Time) Features

WebSocket is **initialized at app startup** and maintains persistent connection.

### Events Listening:

```typescript
// Dashboard real-time stats (orders, revenue)
this.ws.on('dashboard:stats:updated', (stats) => {});

// Order tracking updates
this.ws.on('orders:updated', (order) => {});

// Stock level changes
this.ws.on('stocks:updated', (product) => {});

// New users created
this.ws.on('users:created', (user) => {});
```

### Emitting Events:

```typescript
// Request fresh dashboard data
this.ws.emit('request:stats');

// Custom events as needed
this.ws.emit('custom:event', { data });
```

---

## 🔄 API Integration

**Base URL**: `http://localhost:3000/api` (dev) | `https://api.athenabrand.co` (prod)

### Example: Login Request

```typescript
import { AuthService } from './core/services/auth.service';

// Inject the service
constructor(private auth: AuthService) {}

// Call login
async login() {
  try {
    await this.auth.login({ 
      email: 'admin@athenabrand.co', 
      password: 'secure123' 
    });
    // User logged in, redirected to dashboard
  } catch (error) {
    this.error.set(error.message);
  }
}
```

---

## 🎨 Tailwind Customization

Tailwind v3 is configured in `tailwind.config.ts` with custom color variables:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#1f2937',    // Dark gray (primary brand color)
      secondary: '#3b82f6',  // Blue (secondary actions)
      success: '#10b981',    // Green
      warning: '#f59e0b',    // Amber
      danger: '#ef4444',     // Red
    }
  }
}
```

Use in templates:

```html
<button class="bg-primary text-white hover:bg-primary-700">Login</button>
<div class="border-l-4 border-success">Success message</div>
```

---

## 📦 Deployment (Vercel)

### Steps:

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/athena-frontend.git
   git push -u origin master
   ```

2. **Import project to Vercel dashboard** → Select repo
3. **Build settings**:
   - Framework: Angular
   - Build Command: `npm run build`
   - Output Directory: `dist/frontend`

4. **Environment Variables**:
   ```
   ANGULAR_ENVIRONMENT=production
   API_URL=https://api.athenabrand.co
   ```

5. **Deploy** → Automatic on push to master

---

## 🧪 Testing (Future Plan)

- Unit tests: Jest (components, services)
- E2E tests: Playwright (user flows)
- Testing command: `npm test` (Coming in Phase 2)

---

## 📝 Git Commits

View commit history:
```bash
git log --oneline
```

**Commit conventions**:
- `feat(module): description` - New feature
- `fix(module): description` - Bug fix
- `refactor(module): description` - Code refactoring
- `docs(module): description` - Documentation update

---

## 🛑 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Cannot connect to backend** | Ensure backend runs on port 3000; check `environment.ts` apiUrl |
| **WebSocket not connecting** | Backend must have Socket.io enabled; check `/memories/session/plan.md` |
| **404 on refresh** | Normal for SPA; configure server redirects for production |
| **Tailwind not working** | Ensure `npm install` completed; rebuild with `npm run build` |

---

## 📚 Resources

- [Angular Documentation](https://angular.io)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Socket.io Guide](https://socket.io/docs/)
- [RxJS Documentation](https://rxjs.dev)

---

## 👥 Team

ATHENA Brand Development Team

**Last Updated**: April 7, 2026
**Status**: Phase 1 ✅ Complete | Phase 2 🚧 In Progress

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
