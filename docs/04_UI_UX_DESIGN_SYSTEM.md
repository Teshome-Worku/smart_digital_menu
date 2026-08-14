# Smart Digital Menu — UI/UX Design System

## 1. Design Direction

The product should look like a modern premium restaurant SaaS product.

Customer:
- mobile-first
- app-like
- touch-friendly
- visually rich
- fast
- minimal chrome

Restaurant:
- professional SaaS dashboard
- information-dense but clean
- responsive
- accessible
- desktop optimized

## 2. Customer Layout

Use a mobile viewport as the primary design target.

Persistent bottom navigation:
Home | Menu | Cart | Profile

Avoid a traditional desktop website navbar on customer screens.

Use:
- bottom sheets
- sticky actions
- horizontal category scrolling
- large touch targets
- concise cards
- smooth transitions

## 3. Visual Hierarchy

Prioritize:
1. food image
2. product name
3. price
4. availability
5. tags
6. primary action

Home should answer:
"What should I eat?"

Menu should answer:
"Show me everything."

## 4. Component System

Create reusable components:
- Button
- IconButton
- Input
- SearchBar
- ProductCard
- ProductGrid/List
- CategoryChip
- Badge
- Price
- Rating
- QuantityControl
- BottomNav
- BottomSheet
- Modal
- Toast
- Skeleton
- EmptyState
- ErrorState
- ConfirmationDialog
- StatusBadge
- OrderTimeline
- DataTable
- MetricCard
- ChartCard

## 5. Responsive Rules

Customer:
- optimize 360–430px widths first
- support tablets
- desktop may show a constrained mobile-like shell where appropriate

Restaurant:
- desktop sidebar
- tablet compact navigation
- mobile drawer/compact navigation

Never let desktop layouts simply shrink into unusable mobile layouts.

## 6. Accessibility

Implement:
- semantic HTML
- keyboard support on dashboard
- visible focus states
- sufficient contrast
- alt text
- accessible labels
- touch targets
- form validation messages

## 7. Loading / Error / Empty States

Every data-driven screen must define:
- loading
- success
- empty
- error

Do not leave blank screens while data loads.

## 8. Animation

Use subtle purposeful animation:
- page transitions
- card interaction
- cart changes
- order status
- modal/bottom-sheet entry

Avoid excessive animation.

## 9. Branding

Restaurant branding should be data-driven:
- logo
- name
- optional accent color
- cover/hero image
- description

The platform UI itself should remain consistent while restaurant content is customizable.

## 10. UX Quality Bar

No screen should feel like a generic CRUD template.
Forms must be clear.
Actions must have feedback.
Destructive actions require confirmation.
Prices must be formatted consistently.
Unavailable products must be obvious.
Cart state must remain understandable.
