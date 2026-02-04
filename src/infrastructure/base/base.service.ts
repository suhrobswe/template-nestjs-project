import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';
import { IFindOptions, ISuccess } from '../pagination/successResponse';
import { RepositoryPager } from '../pagination/RepositoryPager';
import { successRes } from '../response/success.response';

export abstract class BaseService<
  T extends ObjectLiteral,
  CreateDto,
  UpdateDto,
> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(dto: CreateDto): Promise<ISuccess> {
    const entity = this.repository.create(dto as any);
    const saved = await this.repository.save(entity);
    return successRes(saved, HttpStatus.CREATED);
  }

  async findAll(options?: IFindOptions<T>): Promise<ISuccess> {
    const data = await this.repository.find(options as any);
    return successRes(data);
  }

  async findAllWithPagination(options: IFindOptions<T>) {
    return RepositoryPager.findAll(this.repository, options);
  }

  async findOneById(id: any, options?: IFindOptions<T>): Promise<ISuccess> {
    const entity = await this.repository.findOne({
      where: { id } as any,
      select: options?.select,
      relations: options?.relations,
    });

    if (!entity)
      throw new NotFoundException(`${this.repository.metadata.name} not found`);
    return successRes(entity);
  }

  async update(id: any, dto: UpdateDto): Promise<ISuccess> {
    await this.findOneById(id);
    await this.repository.update(id, dto as any);
    const updated = await this.repository.findOne({ where: { id } as any });
    return successRes(updated);
  }

  async delete(id: any): Promise<ISuccess> {
    await this.findOneById(id);
    await this.repository.delete(id);
    return successRes({});
  }

  async updateStatus(id: any, field: string = 'isActive'): Promise<ISuccess> {
    const entity = await this.repository.findOne({ where: { id } as any });
    if (!entity) throw new NotFoundException('Entity not found');

    const newStatus = !entity[field];
    await this.repository.update(id, { [field]: newStatus } as any);

    return successRes({ id, [field]: newStatus });
  }

  protected async findOneBy(where: FindOptionsWhere<T>): Promise<T> {
    const entity = await this.repository.findOne({ where });
    if (!entity) throw new NotFoundException('Entity not found');
    return entity;
  }
}
