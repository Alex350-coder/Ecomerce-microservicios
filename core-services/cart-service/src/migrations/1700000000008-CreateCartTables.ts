import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartTables1700000000008 implements MigrationInterface {
  name = 'CreateCartTables1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        guest_id VARCHAR(36) NULL,
        checkout_in_progress TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY uq_carts_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        cart_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        UNIQUE KEY uq_cart_items_cart_product (cart_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS cart_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS carts`);
  }
}
