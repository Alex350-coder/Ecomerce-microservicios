import 'dotenv/config';
import 'reflect-metadata';
import dataSource from '../data-source';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';

interface SeedCategory {
  name: string;
  isActive: boolean;
}

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  price: string;
  discountPercent: number | null;
  validFrom: string | null;
  validTo: string | null;
  categoryName: string;
  images: string[];
  features: string[];
  isFeatured: boolean;
  isNew: boolean;
  rating: string;
  reviewCount: number;
}

const seedCategories: SeedCategory[] = [
  { name: 'Smartphones', isActive: true },
  { name: 'Laptops', isActive: true },
  { name: 'Tablets', isActive: true },
  { name: 'Audio', isActive: true },
  { name: 'Wearables', isActive: true },
  { name: 'Accesorios', isActive: true },
];

const seedProducts: SeedProduct[] = [
  {
    name: 'iPhone 14 Pro',
    slug: 'iphone-14-pro',
    description: 'El último smartphone de Apple con Dynamic Island',
    price: '1099.00',
    discountPercent: 9,
    validFrom: '2025-01-01',
    validTo: '2026-12-31',
    categoryName: 'Smartphones',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'],
    features: ['128GB', '5G', 'Cámara 48MP', 'iOS 16'],
    isFeatured: true,
    isNew: true,
    rating: '4.8',
    reviewCount: 124,
  },
  {
    name: 'Samsung Galaxy S23',
    slug: 'samsung-galaxy-s23',
    description: 'Potente Android con Snapdragon 8 Gen 2',
    price: '849.00',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    categoryName: 'Smartphones',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop'],
    features: ['256GB', '5G', 'Triple Cámara', 'Android 13'],
    isFeatured: false,
    isNew: false,
    rating: '4.6',
    reviewCount: 89,
  },
  {
    name: 'MacBook Pro 14"',
    slug: 'macbook-pro-14',
    description: 'Laptop profesional con chip M2 Pro',
    price: '2199.00',
    discountPercent: 9,
    validFrom: '2025-01-01',
    validTo: '2026-12-31',
    categoryName: 'Laptops',
    images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop'],
    features: ['M2 Pro', '16GB RAM', '512GB SSD', 'macOS'],
    isFeatured: true,
    isNew: true,
    rating: '4.9',
    reviewCount: 67,
  },
  {
    name: 'Dell XPS 13',
    slug: 'dell-xps-13',
    description: 'Laptop ultrafina con pantalla InfinityEdge',
    price: '1299.00',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    categoryName: 'Laptops',
    images: ['https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=300&fit=crop'],
    features: ['Intel i7', '8GB RAM', '256GB SSD', 'Windows 11'],
    isFeatured: false,
    isNew: false,
    rating: '4.5',
    reviewCount: 203,
  },
  {
    name: 'AirPods Pro',
    slug: 'airpods-pro',
    description: 'Audífonos inalámbricos con cancelación activa de ruido',
    price: '249.00',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    categoryName: 'Audio',
    images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop'],
    features: ['Cancelación ruido', 'Resistente agua', '24h batería'],
    isFeatured: false,
    isNew: false,
    rating: '4.7',
    reviewCount: 312,
  },
  {
    name: 'Sony WH-1000XM4',
    slug: 'sony-wh-1000xm4',
    description: 'Audífonos over-ear con sonido HD',
    price: '399.00',
    discountPercent: 13,
    validFrom: '2025-01-01',
    validTo: '2026-12-31',
    categoryName: 'Audio',
    images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop'],
    features: ['30h batería', 'Touch controls', 'Asistente voz'],
    isFeatured: true,
    isNew: true,
    rating: '4.8',
    reviewCount: 189,
  },
  {
    name: 'Apple Watch Series 8',
    slug: 'apple-watch-series-8',
    description: 'Smartwatch con monitoreo de salud avanzado',
    price: '399.00',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    categoryName: 'Wearables',
    images: ['https://images.unsplash.com/photo-1579586337278-3f436c8e5d5a?w=400&h=300&fit=crop'],
    features: ['GPS', 'Resistente agua', 'Monitoreo sueño'],
    isFeatured: false,
    isNew: false,
    rating: '4.6',
    reviewCount: 145,
  },
  {
    name: 'Samsung Galaxy Watch 5',
    slug: 'samsung-galaxy-watch-5',
    description: 'Reloj inteligente con Body Composition',
    price: '329.00',
    discountPercent: 15,
    validFrom: '2025-01-01',
    validTo: '2026-12-31',
    categoryName: 'Wearables',
    images: ['https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=300&fit=crop'],
    features: ['Android/iOS', 'GPS', 'NFC payments'],
    isFeatured: false,
    isNew: true,
    rating: '4.4',
    reviewCount: 98,
  },
  {
    name: 'iPad Air',
    slug: 'ipad-air',
    description: 'Tablet versátil con chip M1',
    price: '599.00',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    categoryName: 'Tablets',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'],
    features: ['M1 Chip', '10.9"', '5G', 'iPadOS'],
    isFeatured: false,
    isNew: false,
    rating: '4.7',
    reviewCount: 167,
  },
  {
    name: 'Samsung Galaxy Tab S8',
    slug: 'samsung-galaxy-tab-s8',
    description: 'Tablet Android de alto rendimiento',
    price: '699.00',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    categoryName: 'Tablets',
    images: ['https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop'],
    features: ['Snapdragon 8', '11" AMOLED', 'S Pen incluido'],
    isFeatured: false,
    isNew: true,
    rating: '4.5',
    reviewCount: 76,
  },
  {
    name: 'Cargador MagSafe',
    slug: 'cargador-magsafe',
    description: 'Cargador magnético para dispositivos Apple',
    price: '39.00',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    categoryName: 'Accesorios',
    images: ['https://images.unsplash.com/photo-1609592810794-3c6c06a32b9a?w=400&h=300&fit=crop'],
    features: ['15W', 'Magnético', 'Compatibilidad universal'],
    isFeatured: false,
    isNew: false,
    rating: '4.2',
    reviewCount: 89,
  },
  {
    name: 'Fundas Personalizadas',
    slug: 'fundas-personalizadas',
    description: 'Fundas protectoras para smartphones',
    price: '25.00',
    discountPercent: null,
    validFrom: null,
    validTo: null,
    categoryName: 'Accesorios',
    images: ['https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=300&fit=crop'],
    features: ['Anticaídas', 'Diseños únicos', 'Material premium'],
    isFeatured: false,
    isNew: false,
    rating: '4.3',
    reviewCount: 234,
  },
];

async function seed(): Promise<void> {
  await dataSource.initialize();
  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);

  const categoryBySlug = new Map<string, Category>();

  for (const seedCategory of seedCategories) {
    const slug = seedCategory.name.toLowerCase();
    let category = await categoryRepo.findOne({ where: { slug } });
    if (category) {
      console.log(`seed: categoría ${slug} ya existe, se omite`);
    } else {
      category = await categoryRepo.save(
        categoryRepo.create({
          name: seedCategory.name,
          slug,
          isActive: seedCategory.isActive,
          createdBy: 'seed',
          updatedBy: 'seed',
        }),
      );
      console.log(`seed: categoría ${slug} creada`);
    }
    categoryBySlug.set(seedCategory.name, category);
  }

  for (const seedProduct of seedProducts) {
    const existing = await productRepo.findOne({ where: { slug: seedProduct.slug } });
    if (existing) {
      console.log(`seed: producto ${seedProduct.slug} ya existe, se omite`);
      continue;
    }

    const category = categoryBySlug.get(seedProduct.categoryName);
    if (!category) {
      throw new Error(`seed: categoría no encontrada para ${seedProduct.categoryName}`);
    }

    await productRepo.save(
      productRepo.create({
        name: seedProduct.name,
        slug: seedProduct.slug,
        description: seedProduct.description,
        price: seedProduct.price,
        discountPercent: seedProduct.discountPercent,
        validFrom: seedProduct.validFrom,
        validTo: seedProduct.validTo,
        categoryId: category.id,
        images: seedProduct.images,
        features: seedProduct.features,
        isFeatured: seedProduct.isFeatured,
        isNew: seedProduct.isNew,
        rating: seedProduct.rating,
        reviewCount: seedProduct.reviewCount,
        createdBy: 'seed',
        updatedBy: 'seed',
      }),
    );
    console.log(`seed: producto ${seedProduct.slug} creado`);
  }

  await dataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('seed failed:', error);
  process.exitCode = 1;
});
