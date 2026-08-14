# Smart Digital Menu — Technical Architecture

## 1. Architecture Goal

Build a maintainable, production-style multi-tenant SaaS foundation.

## 2. Recommended Stack

### Customer + Dashboard
- Next.js
- TypeScript
- Tailwind CSS
- reusable component system

### Backend
- Node.js
- Express.js
- TypeScript
- REST API

### Database
- PostgreSQL
- Prisma ORM

### Authentication
- secure token-based authentication
- password hashing
- role-based authorization
- refresh/session strategy appropriate to deployment

### Image Storage
Use an external object/image storage abstraction such as Cloudinary.

### Deployment
Initial recommended model:
- Next.js frontend: Vercel
- Express API: Render/Railway
- PostgreSQL: Supabase/Neon
- Images: Cloudinary

Choose final providers based on current project constraints.

## 3. High-Level Architecture

Customer PWA
→ API
→ PostgreSQL

Restaurant Dashboard
→ API
→ PostgreSQL

API
→ Authentication
→ Authorization
→ Business services
→ Recommendation service
→ Analytics service
→ QR service

Realtime layer can be introduced for order status.

## 4. Multi-Tenancy

Every restaurant-owned resource must be scoped to a restaurant/workspace.

Never trust restaurantId supplied by an untrusted client.
Derive tenant context from authenticated user or validated QR/session context.

## 5. Roles

OWNER:
- full restaurant control

MANAGER:
- menu, orders, tables, analytics

STAFF:
- operational order actions

CUSTOMER:
- customer-side access

Platform ADMIN may be added later.

## 6. Security Principles

- validate all input
- hash passwords
- protect authenticated endpoints
- enforce tenant isolation
- enforce role permissions
- avoid leaking internal errors
- rate-limit sensitive endpoints
- sanitize/validate uploaded content
- never expose secrets to frontend
- use environment variables
- log security-relevant errors without sensitive data

## 7. QR Context

QR payload should identify the restaurant and table without exposing sensitive information.

Example conceptual route:
`/r/:restaurantSlug/t/:tableToken`

The backend validates the identifiers and creates a guest/session context.

## 8. Guest Session

A guest session can be associated with:
- restaurant
- table
- session identifier
- optional customer account
- createdAt
- expiresAt

Do not require an account for basic ordering.

## 9. Order State Machine

Suggested states:
PENDING
ACCEPTED
PREPARING
READY
COMPLETED
CANCELLED

Only valid state transitions should be accepted.

## 10. Realtime

Order status should support near-real-time updates.

MVP may use efficient polling if realtime infrastructure would delay delivery.
Architecture should allow WebSocket/SSE integration later.

## 11. Analytics

Use event-based tracking for business events.

Avoid excessive tracking.
Only collect events needed for product insights.

## 12. PWA

Customer experience should be PWA-ready:
- manifest
- installability
- responsive layout
- optimized assets
- offline-safe shell where practical

Do not make offline ordering a requirement.

## 13. Engineering Quality

Use:
- strict TypeScript
- linting
- formatting
- reusable services
- environment configuration
- clear error handling
- API validation
- database migrations
- meaningful commit structure
- tests for critical business logic
