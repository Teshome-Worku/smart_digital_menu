# Smart Digital Menu — Database Model

This is the conceptual schema. Exact Prisma syntax should be produced during implementation.

## Core Identity

### User
- id
- name
- email
- passwordHash
- createdAt
- updatedAt

### Restaurant
- id
- name
- slug
- description
- logoUrl
- coverImageUrl
- currency
- timezone
- status
- ownerId
- createdAt
- updatedAt

### RestaurantMembership
- id
- userId
- restaurantId
- role
- createdAt

## Menu

### Category
- id
- restaurantId
- name
- description
- imageUrl
- sortOrder
- isActive
- createdAt
- updatedAt

### Product
- id
- restaurantId
- categoryId
- name
- slug
- description
- imageUrl
- price
- isAvailable
- isFeatured
- sortOrder
- createdAt
- updatedAt

### ProductTag
- id
- restaurantId
- name

### ProductTagAssignment
- productId
- tagId

### ProductModifierGroup
- id
- productId
- name
- required
- minSelections
- maxSelections

### ProductModifier
- id
- groupId
- name
- priceDelta
- isAvailable

## Restaurant Tables

### RestaurantTable
- id
- restaurantId
- name
- number
- qrToken
- isActive
- createdAt

## Customer Context

### CustomerSession
- id
- restaurantId
- tableId
- userId nullable
- sessionToken
- createdAt
- expiresAt

### Favorite
- id
- userId
- productId
- createdAt

## Orders

### Order
- id
- restaurantId
- tableId
- customerSessionId
- userId nullable
- orderNumber
- status
- subtotal
- total
- notes
- createdAt
- updatedAt

### OrderItem
- id
- orderId
- productId
- productNameSnapshot
- unitPriceSnapshot
- quantity
- notes

### OrderItemModifier
- id
- orderItemId
- modifierNameSnapshot
- priceDeltaSnapshot

Snapshots are important because menu prices/names may change after an order is created.

## Promotions

### Promotion
- id
- restaurantId
- name
- description
- type
- value
- startsAt
- endsAt
- isActive

## Feedback

### Review
- id
- restaurantId
- userId nullable
- orderId nullable
- rating
- comment
- createdAt

## Analytics

### AnalyticsEvent
- id
- restaurantId
- customerSessionId nullable
- productId nullable
- eventType
- metadata JSON
- createdAt

## Future

Possible later models:
- LoyaltyAccount
- LoyaltyTransaction
- Subscription
- Payment
- AIConversation
- AIRecommendation
- KitchenStation
