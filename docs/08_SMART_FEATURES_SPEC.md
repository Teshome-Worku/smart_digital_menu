# Smart Digital Menu — Smart Features

## 1. Recommendation Engine

Initial recommendation scoring can be deterministic.

Inputs:
- product tags
- dietary attributes
- popularity
- price range
- time of day
- current category
- cart contents
- customer-selected preferences

Example score:

match tags + dietary fit + popularity + contextual fit

Do not introduce AI simply for marketing.

## 2. Smart Search

Support phrases such as:
- spicy under 500
- vegetarian
- something light
- chicken
- sweet dessert

Initial parser:
- detect known tags
- detect category
- detect price constraints
- detect dietary attributes
- rank matching products

Future:
- natural language model

## 3. Cross-Selling

If Product A is frequently purchased with Product B, recommend B.

Examples:
Burger → fries
Pizza → soft drink
Coffee → cake

Use order history aggregation.

## 4. Popular Now

Calculate popularity using:
- product views
- add-to-cart events
- orders

Use time windows to prevent old products from dominating forever.

## 5. Time-Aware Recommendations

Restaurant/product can have availability windows.

Examples:
Breakfast
Lunch
Dinner

Recommendation ranking can consider local restaurant time.

## 6. Customer Preference Flow

Ask:
- hunger level
- dietary preference
- taste
- budget

Convert answers into structured preference signals.

## 7. Analytics Insights

Dashboard can later produce human-readable insights such as:
"Burger views increased this week."
"Fries are frequently added with burgers."
"Your lunch menu receives most views between 12:00 and 14:00."

Do not make unsupported business claims.

## 8. AI Assistant — Future

The AI assistant should only answer using the restaurant's actual menu and rules.

It should:
- recommend products
- answer menu questions
- respect availability
- respect dietary metadata
- respect price constraints

It must not invent products, prices, ingredients, or availability.

## 9. Smart Feature Quality Rule

Every smart feature must be:
- explainable
- testable
- useful
- measurable

Prefer deterministic logic first.
Add AI only where it creates clear value.
