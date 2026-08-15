import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokens1700000000002 implements MigrationInterface {
  name = 'CreateRefreshTokens1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`family_id\` varchar(36) NOT NULL,
        \`token_hash\` char(64) NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`revoked_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`idx_refresh_tokens_token_hash\` (\`token_hash\`),
        INDEX \`idx_refresh_tokens_user_id\` (\`user_id\`),
        INDEX \`idx_refresh_tokens_family_id\` (\`family_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `refresh_tokens`');
  }
}
