import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000000001 implements MigrationInterface {
  name = 'CreateUsers1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`first_name\` varchar(100) NULL,
        \`last_name\` varchar(100) NULL,
        \`role\` varchar(20) NOT NULL DEFAULT 'user',
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`email_verified\` tinyint(1) NOT NULL DEFAULT 0,
        \`reset_token\` varchar(500) NULL,
        \`reset_token_expires\` datetime NULL,
        \`login_attempts\` int NOT NULL DEFAULT 0,
        \`locked_until\` datetime NULL,
        \`last_login\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`uq_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `users`');
  }
}
