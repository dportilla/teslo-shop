import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private productImagesRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ) {}



  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productsRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImagesRepository.create({ url: image }),
        ),
      });

      await this.productsRepository.save(product);

      return { ...product, images };
    } catch (error) {
      this.handleExecptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productsRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });

    return products.map((product) => ({
      ...product,
      images: product.images.map((image) => image.url),
    }));
  }

  async findOne(id: string) {
    let product: Product;

    if (isUUID(id)) {
      product = await this.productsRepository.findOneBy({ id });
    } else {
      const queryBuilder =
        this.productsRepository.createQueryBuilder('product');
      product = await queryBuilder
        .where('title =:title or slug =:slug', {
          title: id,
          slug: id,
        })
        .leftJoinAndSelect('product.images', 'images')
        .getOne();
    }

    if (!product) {
      throw new BadRequestException(`Product with id ${id} does not exist`);
    }

    return product;
  }

  async findOnePlain(id: string) {
    const { images = [], ...rest } = await this.findOne(id);
    return {
      ...rest,
      images: images.map((image) => image.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productsRepository.preload({ id,...toUpdate });

    if (!product) {
      throw new BadRequestException(`Product with id ${id} does not exist`);
    }

    //QueryRunner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {

      if(images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map(image => this.productImagesRepository.create({ url: image }));
      }
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      
      return this.findOnePlain(id);

    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExecptions(error);

    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return 'Product deleted';
  }

  async deleteAllProducts() {
    const query = this.productsRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handleExecptions(error);
    }
  }

  private handleExecptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(
        `Product with title ${error.detail} already exists`,
      );
    }
    this.logger.error(
      `Failed to create product. Data: Check server logs for details`,
    );
  }
}
