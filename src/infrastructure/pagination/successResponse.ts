export interface ISuccess {
  statusCode: number;
  message: any;
  data: any;
}

export interface IResponsePagination<T> extends ISuccess {
  totalElements: number;
  totalPages: number;
  pageSize: number;
  currentPage: number;
  from: number;
  to: number;
  data: T[];
}

export interface IFindOptions<T> {
  select?: any;
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  relations?: string[];
  order?: any;
  page?: number;
  limit?: number;
}
