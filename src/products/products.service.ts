import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {

      const product = this.productsRepository.create(createProductDto);
      await this.productsRepository.save(product);
      return product;

    } catch (error) {
      this.handleExecptions(error);
    }
  }

  async findAll() {
    return await this.productsRepository.find();
  }

  async findOne(id: string) {
    const product = await this.productsRepository.findOneBy({id});

    if (!product) {
      throw new BadRequestException(`Product with id ${id} does not exist`);
    }

   return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return 'Product deleted';
  }


  private handleExecptions(error: any) {
    if ( error.code === '23505') {
      throw new BadRequestException(`Product with title ${(error.detail)} already exists`);
    }
    this.logger.error(`Failed to create product. Data: Check server logs for details`);
  }


}
