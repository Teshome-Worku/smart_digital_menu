# Smart Digital Menu — User Flows

## 1. Customer Entry Flow

1. Customer scans a restaurant/table QR code.
2. Application opens the mobile web experience.
3. System validates restaurant and table identifiers.
4. System creates or restores a guest session.
5. Customer lands on Home.
6. Table context remains associated with the session.
7. Customer can browse without registration.

## 2. Customer Browsing Flow

Home
→ Search / category / recommendation
→ Product
→ Product customization
→ Add to cart
→ Cart

## 3. Customer Ordering Flow

Cart
→ Review items
→ Confirm table
→ Place order
→ Order confirmation
→ Live/status polling or realtime updates
→ Preparing
→ Ready
→ Completed

## 4. Customer Smart Discovery Flow

Home
→ "What are you craving?"
→ Select preferences
→ Recommendation engine
→ Recommended products
→ Product details
→ Cart

Preferences may include:
- spicy
- vegetarian
- vegan
- light
- filling
- sweet
- high protein
- budget

## 5. Smart Search Flow

Search
→ User enters natural phrase or keywords
→ Search/filter parser
→ Match products
→ Rank results
→ Display explanation/filter chips where appropriate

Initial implementation can use structured rules before AI/NLP.

## 6. Customer Account Flow

Guest
→ Profile
→ Sign in / Sign up
→ Account
→ Order history / favorites / preferences

Login must NOT be required for basic browsing or ordering in the MVP.

## 7. Restaurant Onboarding Flow

Register
→ Create restaurant
→ Restaurant details
→ Create first category
→ Create first products
→ Create tables
→ Generate QR codes
→ Preview customer menu
→ Dashboard

## 8. Restaurant Menu Flow

Dashboard
→ Menu
→ Categories
→ Add/Edit Product
→ Set price/image/description/tags
→ Set availability
→ Save
→ Customer menu updates

## 9. Restaurant Table/QR Flow

Tables
→ Create table
→ Assign table number/name
→ Generate unique QR
→ Preview
→ Download/print QR
→ Scan QR
→ Restaurant + table context restored

## 10. Restaurant Order Flow

Orders
→ New order
→ Review
→ Accept
→ Preparing
→ Ready
→ Completed

Cancelled orders must have an explicit cancellation state.

## 11. Analytics Flow

Customer interaction
→ Analytics event
→ Backend aggregation
→ Dashboard metrics

Track useful events such as:
- menu view
- product view
- search
- add to cart
- order created
- order completed
- recommendation click

Avoid collecting unnecessary personal data.

## 12. Error Flows

Invalid QR:
→ Friendly error
→ Restaurant unavailable/invalid table message

Unavailable product:
→ Clearly marked unavailable
→ Cannot be added to cart

Expired/invalid session:
→ Restore or create guest session

Failed order:
→ Preserve cart
→ Explain failure
→ Allow retry

Unauthorized dashboard action:
→ Deny
→ Explain permission issue
