import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationMetaDto } from '../dto/pagination-meta.dto';

export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
  description?: string,
) =>
  applyDecorators(
    ApiExtraModels(PaginationMetaDto, model),
    ApiOkResponse({
      description,
      schema: {
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          meta: { $ref: getSchemaPath(PaginationMetaDto) },
        },
        required: ['data', 'meta'],
      },
    }),
  );
