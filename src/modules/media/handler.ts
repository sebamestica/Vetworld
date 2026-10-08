import { z } from 'zod';
import { idSchema } from '@/modules/anatomy/schemas/catalog';
import { catalogRepository } from '@/modules/anatomy/repositories/catalog-repository';
import { ApiError } from '@/lib/errors/api-error';
import { errorResponse, paginate, parseQuery } from '@/lib/api/http';
import { mediaRepository } from './repository';
import { referenceResponseSchema, referencesResponseSchema } from './schemas';

const integer = (fallback: number, maximum: number) => z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().min(1).max(maximum)).optional().default(fallback);
const querySchema = z.strictObject({ structure: idSchema.optional(), species: idSchema.optional(), region: idSchema.optional(), page: integer(1, 1000000), limit: integer(20, 100) });
type Context = { params: Promise<{ id?: string }> };
export function createReferencesHandler(detail = false, repository = mediaRepository) {
  return async (request: Request, context?: Context): Promise<Response> => {
    try {
      const query = parseQuery(request.url, detail ? z.strictObject({}) : querySchema);
      const catalog = catalogRepository.read();
      const rows = repository.read();
      const meta = { apiVersion: 'v1' as const, dataVersion: catalog.dataVersion };
      let response;
      if (detail) {
        const parsedId = idSchema.safeParse((await context?.params)?.id);
        if (!parsedId.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Identificador inválido');
        const data = rows.find(row => row.id === parsedId.data);
        if (!data) throw new ApiError(404, 'NOT_FOUND', 'Referencia inexistente');
        response = referenceResponseSchema.parse({ data, meta });
      } else {
        const filters = query as unknown as z.infer<typeof querySchema>;
        for (const [filter, collection] of [['species', catalog.species], ['region', catalog.regions], ['structure', catalog.structures]] as const) {
          if (filters[filter] && !collection.some(row => row.id === filters[filter])) throw new ApiError(400, 'VALIDATION_ERROR', `Filtro ${filter} desconocido`);
        }
        const regions = new Set(filters.region ? [filters.region] : []);
        let size = -1;
        while (size !== regions.size) { size = regions.size; for (const region of catalog.regions) if (region.parentId && regions.has(region.parentId)) regions.add(region.id); }
        const data = rows.filter(row => (!filters.species || row.speciesId === filters.species) && (!filters.structure || row.structureIds.includes(filters.structure)) && (!filters.region || regions.has(row.regionId))).sort((a, b) => a.id.localeCompare(b.id));
        const page = paginate(data, filters.page, filters.limit);
        response = referencesResponseSchema.parse({ data: page.items, meta: { ...meta, pagination: page.pagination } });
      }
      return Response.json(response, { headers: { 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff' } });
    } catch (error) { return errorResponse(error); }
  };
}
