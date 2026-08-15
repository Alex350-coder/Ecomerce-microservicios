import 'dotenv/config';
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import dataSource from '../data-source';
import { User } from '../auth/shared/entities/user.entity';

interface SeedUser {
  email: string;
  password: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
}

function resolveSeedUsers(): SeedUser[] {
  return [
    {
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@electroshop.com',
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'ElectroShop',
    },
    {
      email: process.env.SEED_DEMO_EMAIL ?? 'demo@electroshop.com',
      password: process.env.SEED_DEMO_PASSWORD ?? 'Demo123!',
      role: 'user',
      firstName: 'Demo',
      lastName: 'User',
    },
  ];
}

async function seed(): Promise<void> {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);

  for (const seedUser of resolveSeedUsers()) {
    const existing = await userRepo.findOne({ where: { email: seedUser.email } });
    if (existing) {
      console.log(`seed: ${seedUser.email} ya existe, se omite`);
      continue;
    }

    const passwordHash = await bcrypt.hash(seedUser.password, 12);
    await userRepo.save(
      userRepo.create({
        email: seedUser.email,
        password: passwordHash,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        role: seedUser.role,
        isActive: true,
        emailVerified: true,
        loginAttempts: 0,
      }),
    );
    console.log(`seed: ${seedUser.email} creado (rol ${seedUser.role}, email verificado)`);
  }

  await dataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('seed failed:', error);
  process.exitCode = 1;
});
