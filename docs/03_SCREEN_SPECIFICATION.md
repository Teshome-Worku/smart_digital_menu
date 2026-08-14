# Smart Digital Menu — Screen Specification

## CUSTOMER MOBILE/PWA

### C01 — QR Entry
Purpose: establish restaurant/table context.
States:
- loading
- valid
- invalid
- restaurant unavailable

### C02 — Home
Purpose: discovery and personalization.
Sections:
- restaurant identity
- table context
- greeting
- search
- smart discovery
- recommendations
- popular items
- promotions when available
- categories shortcut
- bottom navigation

### C03 — Menu
Purpose: browse full catalog.
Features:
- category tabs
- search
- filters
- product cards
- availability
- price
- tags

### C04 — Search
Purpose: fast and smart menu discovery.
Features:
- keyword search
- smart phrase support
- recent searches
- filters
- empty state

### C05 — Product Details
Features:
- image
- name
- description
- price
- tags
- dietary information
- modifiers
- quantity
- recommendation/cross-sell
- add to cart

### C06 — Cart
Features:
- items
- quantity controls
- modifiers
- subtotal
- order notes
- table context
- place order

### C07 — Order Confirmation
Features:
- order number
- table
- total
- status
- estimated state message

### C08 — Order Tracking
States:
- received
- accepted
- preparing
- ready
- completed
- cancelled

### C09 — Profile
Features:
- guest/account state
- sign in/sign up
- order history
- favorites
- preferences
- language
- settings

### C10 — Order History
V2.
Features:
- previous orders
- order details
- reorder candidate

### C11 — Favorites
V2.
Features:
- saved products
- quick add

### C12 — Feedback
V2.
Features:
- rating
- text feedback
- order reference

## RESTAURANT DASHBOARD

### R01 — Login
Email/password and validation.

### R02 — Registration
Create owner account.

### R03 — Restaurant Onboarding
Restaurant identity, branding, basic settings.

### R04 — Dashboard
Metrics:
- orders
- revenue
- menu views
- product views
- popular products
- recent orders

### R05 — Categories
CRUD categories, ordering, active/inactive.

### R06 — Products
CRUD products, images, prices, tags, availability, category.

### R07 — Product Editor
Fields:
- name
- description
- price
- image
- category
- tags
- dietary attributes
- modifiers
- availability
- featured flag

### R08 — Orders
Order list, filtering, status transitions.

### R09 — Order Details
Items, modifiers, table, customer session, timestamps.

### R10 — Tables
Create/edit/archive tables.

### R11 — QR Codes
Generate, preview, download/print.

### R12 — Analytics
Charts and summary metrics.

### R13 — Promotions
V2.

### R14 — Staff
V2.

### R15 — Settings
Restaurant profile, hours, currency, language, branding.

## NAVIGATION RULES

Customer bottom navigation:
- Home
- Menu
- Cart
- Profile

Restaurant desktop:
- Dashboard
- Orders
- Menu
- Categories
- Tables
- QR Codes
- Analytics
- Promotions (V2)
- Staff (V2)
- Settings

Restaurant mobile should collapse the navigation into a drawer or compact navigation pattern.
