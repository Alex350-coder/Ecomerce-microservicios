import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayments1700000000009 implements MigrationInterface {
  name = 'CreatePayments1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        idempotency_key VARCHAR(36) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(30) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        failure_reason VARCHAR(255) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY uq_payment_intents_order (order_id),
        UNIQUE KEY uq_payment_intents_idempotency (idempotency_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS payment_intents`);
  }
}
