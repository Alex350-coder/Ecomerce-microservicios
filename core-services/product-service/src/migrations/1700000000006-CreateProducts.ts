import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1700000000006 implements MigrationInterface {
  name = 'CreateProducts1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`products\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(200) NOT NULL,
        \`slug\` varchar(220) NOT NULL,
        \`description\` text NOT NULL,
        \`price\` decimal(10,2) NOT NULL,
        \`discount_percent\` int NULL,
        \`valid_from\` datetime NULL,
        \`valid_to\` datetime NULL,
        \`category_id\` varchar(36) NOT NULL,
        \`images\` text NOT NULL,
        \`features\` text NOT NULL,
        \`rating\` decimal(2,1) NULL,
        \`review_count\` int NOT NULL DEFAULT 0,
        \`is_new\` tinyint(1) NOT NULL DEFAULT 0,
        \`is_featured\` tinyint(1) NOT NULL DEFAULT 0,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_by\` varchar(36) NULL,
        \`updated_by\` varchar(36) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        UNIQUE INDEX \`uq_products_slug\` (\`slug\`),
        INDEX \`idx_products_category\` (\`category_id\`),
        CONSTRAINT \`fk_products_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `products`');
  }
}
