import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategories1700000000005 implements MigrationInterface {
  name = 'CreateCategories1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`categories\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`slug\` varchar(120) NOT NULL,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_by\` varchar(36) NULL,
        \`updated_by\` varchar(36) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        UNIQUE INDEX \`uq_categories_name\` (\`name\`),
        UNIQUE INDEX \`uq_categories_slug\` (\`slug\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `categories`');
  }
}
