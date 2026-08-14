import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
    update: {},
    create: {
      name: 'The Golden Fork',
      slug: 'the-golden-fork',
      description: 'A premium dining experience with curated flavors from around the world.',
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
