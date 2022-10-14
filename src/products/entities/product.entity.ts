import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ProductImage } from './';

@Entity()
export class Product {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', unique: true,})
    title: string;

    @Column({ type: 'float', default: 0 })
    price: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', unique: true })
    slug: string;

    @Column({ type: 'int', default: 0 })
    stock: number;

    @Column({ type: 'text', array: true })
    sizes: string[];

    @Column({ type: 'text' })
    gender: string;

    @Column({ type: 'text', array: true, default: [] })
    tags: string[];

    @OneToMany(
        () => ProductImage, 
        (productImage) => productImage.product, 
        { cascade: true}
    )
    images?: ProductImage[];

    @CreateDateColumn({ type: 'timestamp without time zone', default: 'NOW()' })
    createdAt: Date

    @UpdateDateColumn({ type: 'timestamp without time zone', onUpdate: 'NOW()', nullable: true })
    updatedAt: Date


    @BeforeInsert()
    checkSlugInsert() {
        if(!this.slug) {
            this.slug = this.title
        }
        this.slug = this.slug.toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '');
    }

     @BeforeUpdate()
    checkSlugUpdate() {
        if(!this.slug) {
            this.slug = this.title
        }
        this.slug = this.slug.toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '');
    }
}
