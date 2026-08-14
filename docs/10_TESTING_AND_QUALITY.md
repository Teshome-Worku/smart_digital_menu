# Smart Digital Menu — Testing and Quality

## Critical Customer Tests

- valid QR opens correct restaurant
- valid QR opens correct table
- invalid QR shows friendly error
- menu loads
- category filtering works
- search works
- unavailable product cannot be ordered
- modifiers calculate correctly
- cart totals are correct
- order is created once
- order status is visible
- guest can order without registration

## Critical Restaurant Tests

- owner can log in
- unauthorized user cannot access dashboard
- manager cannot perform owner-only actions
- tenant A cannot access tenant B data
- product CRUD works
- availability updates
- table CRUD works
- QR is unique
- order status transitions are valid
- analytics events are recorded

## Security Tests

- password never returned by API
- protected routes reject unauthenticated requests
- role restrictions enforced server-side
- tenant isolation enforced
- invalid IDs handled safely
- input validation applied
- secrets absent from client bundle

## UX Tests

Check:
- 360px mobile
- 390px mobile
- tablet
- desktop
- slow network
- empty restaurant
- no products
- no orders
- unavailable items
- long product names
- large images
- failed API request

## Performance

- optimize food images
- lazy-load noncritical images
- avoid unnecessary API calls
- paginate dashboard data
- cache public menu data where safe
- keep customer first-load fast

## Portfolio Quality Gate

Before calling the project complete:
- no broken links
- no obvious placeholder text
- no unhandled UI states
- no major console errors
- polished responsive UI
- seeded demo data
- clean README
- architecture documented
- live demo available
