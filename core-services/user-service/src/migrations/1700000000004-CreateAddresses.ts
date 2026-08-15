import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAddresses1700000000004 implements MigrationInterface {
  name = 'CreateAddresses1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`addresses\` (
        \`id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`label\` varchar(50) NOT NULL,
        \`recipient_name\` varchar(100) NULL,
        \`street\` varchar(200) NOT NULL,
        \`city\` varchar(100) NOT NULL,
        \`state\` varchar(100) NULL,
        \`zip_code\` varchar(20) NULL,
        \`country\` varchar(100) NOT NULL,
        \`is_default\` tinyint(1) NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`idx_addresses_user_id\` (\`user_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `addresses`');
  }
}
