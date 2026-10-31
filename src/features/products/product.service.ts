import { ProductRepository } from "./product.repository";

export class ProductService {
  static getProductById(id: string) {
    return ProductRepository.getById(id);
  }

  static searchProducts(query: string) {
    return ProductRepository.search(query);
  }

  static getAllProducts(limit = 50) {
    return ProductRepository.list(limit);
  }
}
