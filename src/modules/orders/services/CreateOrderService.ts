import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository') private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  /**
   * Creates order passing the customer_id and an array of objects
   * containing product_id and quantities
   * @param id customer id as uuid string
   * @param products [{ id: string, quantity: number}]
   */
  public async execute({ id, products }: IRequest): Promise<Order> {
    // Check for customer existence
    const customer = await this.customersRepository.findById(id);

    if (!customer) throw new AppError('No user found');

    // Check for products existence and fetch data
    const fetchedProducts = await this.productsRepository.findAllById(products);

    if (!fetchedProducts.length) throw new AppError("Couldn't fetch products.");

    const fetchedProductsIds = fetchedProducts.map((product) => product.id);

    const inexistingItems = products.filter(
      (product) => !fetchedProductsIds.includes(product.id),
    );

    if (inexistingItems.length)
      throw new AppError(
        `These items do not exist: ${inexistingItems.join(', ')}`,
      );

    // Check for products availability

    const insuficientQuantity = products.filter(
      (product) =>
        fetchedProducts.filter((fprod) => fprod.id === product.id)[0].quantity <
        product.quantity,
    );

    if (insuficientQuantity.length)
      throw new AppError(
        `These items have insuficient quantity: ${insuficientQuantity.join(
          ', ',
        )}`,
      );

    const serializedProduct = fetchedProducts.map((product) => ({
      id: product.id,
      quantity: product.quantity,
      price: product.price,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProduct,
    });

    // Subtract products quantities
    const { order_products } = order;

    const orderedProductsQuantity = order_products.map((product) => ({
      id: product.product_id,
      quantity:
        fetchedProducts.filter((p) => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
