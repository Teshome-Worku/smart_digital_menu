# Smart Digital Menu — Product Requirements

## 1. Product Vision

Smart Digital Menu is a multi-tenant restaurant technology platform whose customer entry point is a QR code.

It is NOT simply a QR menu. It provides:
- Mobile-first digital menu experience
- QR/table context
- Menu discovery and smart search
- Product customization
- Cart and table ordering
- Order tracking
- Restaurant management dashboard
- Table and QR management
- Analytics
- Recommendations and cross-selling
- Promotions
- Role-based restaurant access
- Multilingual readiness
- Future AI-assisted menu discovery

## 2. Target Users

### Customer
A restaurant guest using a phone or tablet after scanning a QR code.

### Restaurant Owner
Owns the restaurant workspace and has full control.

### Restaurant Manager
Manages menu, orders, tables and operational features.

### Restaurant Staff
Handles operational tasks such as orders.

### Future Platform Admin
Manages the SaaS platform itself.

## 3. Core Product Principle

Customer experience must feel like a native mobile application even though the first implementation is a responsive web app/PWA.

Restaurant management must work on desktop and mobile, with desktop optimized for administration.

## 4. MVP

### Customer
- QR entry
- Restaurant/table detection
- Guest session
- Home
- Menu
- Categories
- Search
- Product details
- Product modifiers
- Cart
- Place order
- Order confirmation
- Order status
- Profile/guest state
- Language-ready architecture

### Restaurant
- Authentication
- Restaurant onboarding
- Dashboard
- Category management
- Product management
- Availability toggle
- Table management
- QR generation
- Order management
- Basic analytics
- Restaurant settings

### Platform
- Multi-tenant data model
- Role-based authorization
- REST API
- PostgreSQL persistence
- Image storage abstraction
- Responsive UI
- Validation and error handling

## 5. V2

- Favorites
- Order history
- Reviews/feedback
- Promotions
- Advanced analytics
- Smart recommendation engine
- Popular-now ranking
- Cross-selling
- Time-aware recommendations
- Staff management
- Kitchen display workflow
- Improved multilingual content management
- PWA install support

## 6. Future / Experimental

- Natural-language AI menu assistant
- AI-generated restaurant insights
- AI-assisted menu descriptions
- Loyalty/rewards
- Payments
- Reservations
- Subscription/billing for restaurants
- Advanced customer profiles
- Predictive analytics

## 7. Non-Goals for Initial Release

Do not build:
- Native Android/iOS applications
- Full delivery marketplace
- Complex accounting
- Full POS replacement
- Payment gateway before core ordering works
- Unnecessary AI features
- Social network features

## 8. Success Criteria

The demo must make a prospective Upwork client immediately understand that the developer can build:
- production-style responsive interfaces
- SaaS dashboards
- REST APIs
- relational database systems
- authentication/authorization
- QR-driven workflows
- ordering systems
- recommendation logic
- analytics
- polished mobile UX

The demo should be believable as a product a real restaurant could deploy.
