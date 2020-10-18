import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export default class ForeignKeys1602878017545 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'OrderCustomer',
        columnNames: ['customer_id'],
        referencedColumnNames: ['customer_id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKeys('order_products', [
      new TableForeignKey({
        name: 'OrderProductOrder',
        columnNames: ['order_id'],
        referencedColumnNames: ['order_id'],
        referencedTableName: 'orders',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'OrderProductProduct',
        columnNames: ['product_id'],
        referencedColumnNames: ['product_id'],
        referencedTableName: 'products',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropForeignKey('order_products', 'OrderProduct');
    await queryRunner.dropForeignKey('orders', 'OrderCustomer');
  }
}
