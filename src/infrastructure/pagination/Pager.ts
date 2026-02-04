import { IResponsePagination } from './successResponse';

export class Pager {
  public static of<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): IResponsePagination<T> {
    const totalPages = Math.ceil(total / limit);
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    return {
      statusCode: 200,
      message: {
        uz: 'Amaliyot muvaffaqiyatli bajarildi',
        en: 'Operation successfully completed',
        ru: 'Операция успешно выполнена',
      },
      data,
      totalElements: total,
      totalPages,
      pageSize: limit,
      currentPage: page,
      from,
      to,
    };
  }
}
