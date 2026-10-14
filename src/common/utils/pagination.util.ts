import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponse } from '../interface/paginated-response.interface';

export function getPaginationOptions({ page, limit }: PaginationQueryDto) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function toPaginatedResponse<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationQueryDto,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
