import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { validate as isUUID } from 'uuid'

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

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    return await this.productsRepository.find({
      take: limit,
      skip: offset,
      //TODO: relaciones
    });
  }

  async findOne(id: string) {
    let product: Product;

    if (isUUID(id)) {
      product = await this.productsRepository.findOneBy({id});

    } else {
      const queryBuilder = this.productsRepository.createQueryBuilder();
      product = await queryBuilder
        .where('title =:title or slug =:slug', {
          title: id,
          slug: id,
        }).getOne();
    }
    
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
