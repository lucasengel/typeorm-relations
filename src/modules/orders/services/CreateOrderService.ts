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
  customer_id: string;
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

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // Check for customer existence
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) throw new AppError('No user found');

    const productsIds = products.map((prod) => ({ id: prod.id }));

    const fetchedProducts = await this.productsRepository.findAllById(
      productsIds,
    );

    if (fetchedProducts.length !== products.length)
      throw new AppError('Unable to find one or more products');

    const serializedProducts = products.map(({ id, quantity }) => {
      const productDetails = fetchedProducts.find(
        (product) => product.id === id,
      );

      const price = Number(productDetails?.price);

      return {
        product_id: id,
        quantity,
        price,
      };
    });

    // Check for products availability

    // const insufficientQuantity = products.filter(
    //   (product) =>
    //     fetchedProducts.filter((fprod) => fprod.id === product.id)[0].quantity <
    //     product.quantity,
    // );

    // if (insufficientQuantity.length)
    //   throw new AppError(
    //     `These items have insufficient quantity: ${insufficientQuantity.join(
    //       ', ',
    //     )}`,
    //   );

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProducts,
    });

    // Subtract products quantities
    // const { order_products } = order;

    // const orderedProductsQuantity = order_products.map((product) => ({
    //   id: product.product_id,
    //   quantity:
    //     fetchedProducts.filter((p) => p.id === product.product_id)[0].quantity -
    //     product.quantity,
    // }));

    // await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
