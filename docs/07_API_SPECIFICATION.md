# Smart Digital Menu — API Specification

Base path example:
`/api/v1`

## Authentication

POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/me

## Restaurant

POST /restaurants
GET /restaurants/:id
PUT /restaurants/:id
GET /restaurants/:id/settings
PUT /restaurants/:id/settings

## Public Menu

GET /public/restaurants/:slug
GET /public/restaurants/:slug/categories
GET /public/restaurants/:slug/products
GET /public/restaurants/:slug/products/:productId

Public endpoints must only return published/allowed data.

## Categories

GET /restaurants/:restaurantId/categories
POST /restaurants/:restaurantId/categories
PUT /restaurants/:restaurantId/categories/:id
DELETE /restaurants/:restaurantId/categories/:id

## Products

GET /restaurants/:restaurantId/products
POST /restaurants/:restaurantId/products
GET /restaurants/:restaurantId/products/:id
PUT /restaurants/:restaurantId/products/:id
DELETE /restaurants/:restaurantId/products/:id
PATCH /restaurants/:restaurantId/products/:id/availability

## Tables

GET /restaurants/:restaurantId/tables
POST /restaurants/:restaurantId/tables
PUT /restaurants/:restaurantId/tables/:id
DELETE /restaurants/:restaurantId/tables/:id

## QR

POST /restaurants/:restaurantId/tables/:id/qr
GET /restaurants/:restaurantId/tables/:id/qr
GET /restaurants/:restaurantId/qr/export

## Guest Sessions

POST /guest-sessions
GET /guest-sessions/:id

## Orders

POST /orders
GET /orders/:id
GET /restaurants/:restaurantId/orders
PATCH /restaurants/:restaurantId/orders/:id/status

## Analytics

POST /analytics/events
GET /restaurants/:restaurantId/analytics/overview
GET /restaurants/:restaurantId/analytics/products
GET /restaurants/:restaurantId/analytics/orders

## Recommendations

GET /public/restaurants/:slug/recommendations
POST /recommendations/feedback

## Search

GET /public/restaurants/:slug/search?q=
Support structured parameters such as:
- category
- maxPrice
- tags
- dietary attributes
- availability

## API Rules

- Validate request bodies and query parameters.
- Authenticate private endpoints.
- Authorize every restaurant resource.
- Never trust restaurantId from arbitrary client input.
- Return consistent error shapes.
- Use pagination for large collections.
- Use HTTP status codes correctly.
- Do not expose passwords or internal secrets.
