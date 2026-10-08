import { idSchema } from '@/modules/anatomy/schemas/catalog';
import { catalogRepository, type CatalogRepository } from '@/modules/anatomy/repositories/catalog-repository';
import { catalogService, type CatalogQuery } from '@/modules/catalog/services/catalog-service';
import { ApiError } from '@/lib/errors/api-error';
import { responseSchemas, querySchemas, type Endpoint } from './contracts';
import { errorResponse, parseQuery, paginate } from './http';

type Service = typeof catalogService;
type Context = { params: Promise<{ id?: string }> };
const listEndpoints = new Set<Endpoint>(['species', 'regions', 'structures', 'relations', 'search', 'systems', 'layers', 'models', 'sources']);

export function createHandler(endpoint: Endpoint, service: Service = catalogService, repository: CatalogRepository = catalogRepository) {
  return async function GET(request: Request, context?: Context): Promise<Response> {
    try {
      const parsed = parseQuery(request.url, querySchemas[endpoint]);
      const query = parsed as CatalogQuery & { page?: number; limit?: number };
      const version = repository.read().dataVersion;
      let id = '';
      if (['region', 'structure', 'relations', 'model', 'source'].includes(endpoint)) {
        const result = idSchema.safeParse((await context?.params)?.id);
        if (!result.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Identificador inválido');
        id = result.data;
      }
      let data: unknown;
      switch (endpoint) {
        case 'health': data = { status: 'ok', apiVersion: 'v1', catalogStatus: 'readable', dataVersion: version }; break;
        case 'species': data = service.species(query); break;
        case 'regions': data = service.regions(query); break;
        case 'region': data = service.region(id, query); break;
        case 'structures': data = service.structures(query); break;
        case 'structure': data = service.structure(id); break;
        case 'relations': data = service.relations(id, query); break;
        case 'search': data = service.search(query); break;
        case 'systems': data = service.systems(); break;
        case 'layers': data = service.layers(query); break;
        case 'models': data = service.models(query); break;
        case 'model': data = service.model(id); break;
        case 'sources': data = service.sources(); break;
        case 'source': data = service.source(id); break;
        case 'taxonomy': data = service.taxonomy(); break;
        case 'stats': data = service.stats(); break;
      }
      let meta: { apiVersion: 'v1'; dataVersion: string; pagination?: ReturnType<typeof paginate>['pagination'] } = { apiVersion: 'v1', dataVersion: version };
      if (listEndpoints.has(endpoint)) {
        if (!Array.isArray(data)) throw new Error('Invalid service list');
        const page = paginate(data, query.page ?? 1, query.limit ?? 20);
        data = page.items; meta = { ...meta, pagination: page.pagination };
      }
      const response = responseSchemas[endpoint].parse({ data, meta });
      return Response.json(response, { headers: {
        'Cache-Control': endpoint === 'health' ? 'no-store' : 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
      } });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function createHeadHandler(get: ReturnType<typeof createHandler>) {
  return async (request: Request, context?: Context) => {
    const response = await get(request, context);
    return new Response(null, { status: response.status, headers: response.headers });
  };
}
