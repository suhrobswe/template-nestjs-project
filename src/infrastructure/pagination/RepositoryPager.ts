import { FindManyOptions, ObjectLiteral, Repository } from 'typeorm';
import { IResponsePagination, IFindOptions } from './successResponse';
import { Pager } from './Pager';

export class RepositoryPager {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 10;

  public static async findAll<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: IFindOptions<T> = {},
  ): Promise<IResponsePagination<T>> {
    const page = options.page > 0 ? options.page : this.DEFAULT_PAGE;
    const limit = options.limit > 0 ? options.limit : this.DEFAULT_LIMIT;

    const findOptions: FindManyOptions<T> = {
      where: options.where,
      relations: options.relations,
      select: options.select,
      order: options.order,
      take: limit,
      skip: (page - 1) * limit,
    };

    const [data, total] = await repository.findAndCount(findOptions);
    return Pager.of(data, total, page, limit);
  }
}
