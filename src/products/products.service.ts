import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';
import { validate as isUUID } from 'uuid'

@Injectable()
export class ProductsService {

  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private productImagesRepository: Repository<ProductImage>,
  ) {}


  async create(createProductDto: CreateProductDto) {
    try {

      const { images = [], ...productDetails } = createProductDto;

      const product = this.productsRepository.create({
        ...productDetails,
        images: images.map((image) => this.productImagesRepository.create({url: image})),
      });

      await this.productsRepository.save(product);

      return { ...product, images };

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

    const product = await this.productsRepository.preload({
      id: id,
      ...updateProductDto,
      images: [],
    });

    if (!product) {
      throw new BadRequestException(`Product with id ${id} does not exist`);
    }

    try {
      await this.productsRepository.save(product);
      return product;
      
    } catch (error) {
      this.handleExecptions(error);
    }

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
