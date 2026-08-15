import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserProfiles1700000000003 implements MigrationInterface {
  name = 'CreateUserProfiles1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`user_profiles\` (
        \`id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`email\` varchar(255) NULL,
        \`first_name\` varchar(100) NULL,
        \`last_name\` varchar(100) NULL,
        \`phone\` varchar(50) NULL,
        \`avatar_url\` varchar(500) NULL,
        \`birthdate\` date NULL,
        \`newsletter\` tinyint(1) NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`uq_user_profiles_user_id\` (\`user_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `user_profiles`');
  }
}
