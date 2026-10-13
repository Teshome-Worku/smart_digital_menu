import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create demo owner user
  const passwordHash = await bcrypt.hash('DemoPass123', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      name: 'Demo Owner',
      email: 'owner@demo.com',
      passwordHash,
    },
  });
  console.log(`  ✅ User: ${owner.email}`);

  // Create demo restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'the-golden-fork' },
    update: {
      logoUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=256&q=85',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85',
      status: 'ACTIVE',
    },
    create: {
      name: 'The Golden Fork',
      slug: 'the-golden-fork',
      description: 'A premium dining experience with curated flavors from around the world.',
      logoUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=256&q=85',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85',
      currency: 'USD',
      timezone: 'America/New_York',
      ownerId: owner.id,
    },
  });
  console.log(`  ✅ Restaurant: ${restaurant.name} (${restaurant.slug})`);

  // Create owner membership
  await prisma.restaurantMembership.upsert({
    where: {
      userId_restaurantId: {
        userId: owner.id,
        restaurantId: restaurant.id,
      },
    },
    update: {},
    create: {
      userId: owner.id,
      restaurantId: restaurant.id,
      role: 'OWNER',
    },
  });
  console.log(`  ✅ Membership: OWNER`);

  const menu = [
    {
      name: 'Starters',
      description: 'Small plates made for sharing.',
      products: [
        {
          slug: 'truffle-parmesan-fries',
          name: 'Truffle Parmesan Fries',
          description: 'Crispy hand-cut fries, truffle oil, parmesan, and fresh herbs.',
          price: 8.5,
          imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',
          isFeatured: true,
          tags: ['Popular', 'Vegetarian'],
        },
        {
          slug: 'crispy-calamari',
          name: 'Crispy Calamari',
          description: 'Tender calamari with lemon, herbs, and a bright roasted garlic aioli.',
          price: 13,
          imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=85',
          isFeatured: false,
          tags: ['Chef pick'],
        },
        {
          slug: 'burrata-bruschetta',
          name: 'Burrata Bruschetta',
          description: 'Creamy burrata, toasted sourdough, tomatoes, basil, and balsamic glaze.',
          price: 11.5,
          imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=900&q=85',
          isFeatured: true,
          tags: ['Vegetarian'],
        },
      ],
    },
    {
      name: 'Mains',
      description: 'Signature plates from our kitchen.',
      products: [
        {
          slug: 'herb-roasted-chicken',
          name: 'Herb Roasted Chicken',
          description: 'Juicy roasted chicken breast, creamy mash, seasonal vegetables, and pan jus.',
          price: 22,
          imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85',
          isFeatured: true,
          tags: ['Signature'],
        },
        {
          slug: 'wild-mushroom-pasta',
          name: 'Wild Mushroom Pasta',
          description: 'House-made tagliatelle, wild mushrooms, parmesan cream, and thyme.',
          price: 18.5,
          imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85',
          isFeatured: true,
          tags: ['Vegetarian', 'Popular'],
        },
        {
          slug: 'grilled-salmon',
          name: 'Citrus Grilled Salmon',
          description: 'Grilled salmon, lemon beurre blanc, asparagus, and crispy potatoes.',
          price: 26,
          imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=85',
          isFeatured: false,
          tags: ['Light'],
        },
        {
          slug: 'golden-fork-burger',
          name: 'Golden Fork Burger',
          description: 'Chargrilled beef, aged cheddar, caramelized onion, house sauce, and fries.',
          price: 19,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
          isFeatured: true,
          tags: ['Popular'],
        },
      ],
    },
    {
      name: 'Salads & Bowls',
      description: 'Fresh, colorful, and satisfying.',
      products: [
        {
          slug: 'mediterranean-grain-bowl',
          name: 'Mediterranean Grain Bowl',
          description: 'Quinoa, roasted vegetables, cucumber, feta, herbs, and lemon tahini.',
          price: 16,
          imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85',
          isFeatured: false,
          tags: ['Healthy', 'Vegetarian'],
        },
        {
          slug: 'classic-caesar-salad',
          name: 'Classic Caesar Salad',
          description: 'Crisp romaine, parmesan, garlic croutons, and our creamy Caesar dressing.',
          price: 12,
          imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=900&q=85',
          isFeatured: false,
          tags: ['Classic'],
        },
      ],
    },
    {
      name: 'Desserts',
      description: 'A sweet finish to your meal.',
      products: [
        {
          slug: 'salted-caramel-cheesecake',
          name: 'Salted Caramel Cheesecake',
          description: 'Silky vanilla cheesecake, salted caramel, and a buttery biscuit base.',
          price: 9,
          imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85',
          isFeatured: true,
          tags: ['Best seller'],
        },
        {
          slug: 'chocolate-lava-cake',
          name: 'Chocolate Lava Cake',
          description: 'Warm dark chocolate cake with a molten center and vanilla ice cream.',
          price: 10,
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85',
          isFeatured: false,
          tags: ['Chocolate'],
        },
      ],
    },
    {
      name: 'Drinks',
      description: 'Refreshing drinks and house favorites.',
      products: [
        {
          slug: 'passionfruit-spritz',
          name: 'Passionfruit Spritz',
          description: 'Passionfruit, citrus, sparkling water, and mint over ice.',
          price: 7,
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85',
          isFeatured: true,
          tags: ['Refreshing'],
        },
        {
          slug: 'iced-vanilla-latte',
          name: 'Iced Vanilla Latte',
          description: 'Double espresso, vanilla, and chilled milk over ice.',
          price: 6,
          imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85',
          isFeatured: false,
          tags: ['Coffee'],
        },
      ],
    },
  ];

  for (const [categoryIndex, categoryData] of menu.entries()) {
    const category = await prisma.category.upsert({
      where: {
        id: `${restaurant.id}-demo-${categoryIndex}`,
      },
      update: {
        name: categoryData.name,
        description: categoryData.description,
        sortOrder: categoryIndex,
        isActive: true,
      },
      create: {
        id: `${restaurant.id}-demo-${categoryIndex}`,
        restaurantId: restaurant.id,
        name: categoryData.name,
        description: categoryData.description,
        sortOrder: categoryIndex,
      },
    });

    for (const [productIndex, productData] of categoryData.products.entries()) {
      const product = await prisma.product.upsert({
        where: {
          restaurantId_slug: {
            restaurantId: restaurant.id,
            slug: productData.slug,
          },
        },
        update: {
          categoryId: category.id,
          name: productData.name,
          description: productData.description,
          imageUrl: productData.imageUrl,
          price: productData.price,
          isAvailable: true,
          isFeatured: productData.isFeatured,
          sortOrder: productIndex,
        },
        create: {
          restaurantId: restaurant.id,
          categoryId: category.id,
          slug: productData.slug,
          name: productData.name,
          description: productData.description,
          imageUrl: productData.imageUrl,
          price: productData.price,
          isFeatured: productData.isFeatured,
          sortOrder: productIndex,
        },
      });

      for (const tagName of productData.tags) {
        const tag = await prisma.productTag.upsert({
          where: {
            restaurantId_name: {
              restaurantId: restaurant.id,
              name: tagName,
            },
          },
          update: {},
          create: { restaurantId: restaurant.id, name: tagName },
        });
        await prisma.productTagAssignment.upsert({
          where: { productId_tagId: { productId: product.id, tagId: tag.id } },
          update: {},
          create: { productId: product.id, tagId: tag.id },
        });
      }
    }
  }
  console.log(`  ✅ Demo menu: ${menu.reduce((count, category) => count + category.products.length, 0)} products`);

  const featuredProduct = await prisma.product.findUnique({
    where: { restaurantId_slug: { restaurantId: restaurant.id, slug: 'golden-fork-burger' } },
  });
  if (featuredProduct) {
    const group = await prisma.productModifierGroup.findFirst({
      where: { productId: featuredProduct.id, name: 'Choose your cheese' },
    }) ?? await prisma.productModifierGroup.create({
      data: {
        productId: featuredProduct.id,
        name: 'Choose your cheese',
        required: false,
        maxSelections: 1,
      },
    });
    for (const [name, priceDelta] of [['Aged cheddar', 0], ['Blue cheese', 1.5], ['Smoked gouda', 1.5]] as const) {
      await prisma.productModifier.upsert({
        where: { id: `${group.id}-${name.toLowerCase().replace(/\s+/g, '-')}` },
        update: { name, priceDelta, isAvailable: true },
        create: {
          id: `${group.id}-${name.toLowerCase().replace(/\s+/g, '-')}`,
          groupId: group.id,
          name,
          priceDelta,
        },
      });
    }
  }

  // Create demo table
  const table = await prisma.restaurantTable.upsert({
    where: {
      restaurantId_number: {
        restaurantId: restaurant.id,
        number: 1,
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: 'Table 1',
      number: 1,
      qrToken: crypto.randomBytes(32).toString('hex'),
    },
  });
  console.log(`  ✅ Table: ${table.name} (QR Token: ${table.qrToken})`);

  console.log('\n✨ Seed completed!\n');
  console.log('  Demo credentials:');
  console.log('  Email:    owner@demo.com');
  console.log('  Password: DemoPass123\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
