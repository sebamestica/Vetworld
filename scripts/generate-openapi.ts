import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { responseSchemas, querySchemas, errorSchema, type Endpoint } from '../src/lib/api/contracts';

const paths: Record<Endpoint, string> = {
  health: '/health', species: '/species', regions: '/regions', region: '/regions/{id}',
  structures: '/structures', structure: '/structures/{id}', relations: '/structures/{id}/relations',
  search: '/search', systems: '/systems', layers: '/layers', models: '/models', model: '/models/{id}',
  sources: '/sources', source: '/sources/{id}', taxonomy: '/taxonomy', stats: '/stats',
};
const schemaJson = (schema: z.ZodType) => z.toJSONSchema(schema, { unrepresentable: 'any' });
const components = Object.fromEntries(Object.entries(responseSchemas).map(([key, schema]) => [key, schemaJson(schema)]));
const operations = Object.fromEntries(Object.entries(paths).map(([key, path]) => {
  const endpoint = key as Endpoint;
  // Input schema preserves query lexical constraints before numeric transforms.
  const query = z.toJSONSchema(querySchemas[endpoint], { io: 'input', unrepresentable: 'any' });
  const properties = (query.properties ?? {}) as Record<string, object>;
  const parameters: object[] = Object.entries(properties).map(([name, schema]) => ({ name, in: 'query', required: query.required?.includes(name) ?? false, schema }));
  if (path.includes('{id}')) parameters.unshift({ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[a-z0-9][a-z0-9:-]*$' } });
  const errorResponses = Object.fromEntries(['400', '404', '500'].map(status => [status, { description: 'Error JSON estructurado', content: { 'application/json': { schema: { $ref: '#/components/schemas/error' } } } }]));
  return [`/api/v1${path}`, { get: {
    operationId: endpoint, summary: `Consultar ${endpoint}`, parameters,
    responses: { '200': { description: 'Consulta correcta', content: { 'application/json': { schema: { $ref: `#/components/schemas/${endpoint}` } } } }, ...errorResponses },
  }, head: { summary: 'Cabeceras de GET, sin cuerpo', parameters, responses: { '200': { description: 'Mismas cabeceras que GET' }, '400': { description: 'Parámetros inválidos' }, '404': { description: 'Recurso inexistente' }, '500': { description: 'Fallo interno' } } },
  options: { responses: { '204': { description: 'Métodos permitidos: GET, HEAD, OPTIONS' } } },
  ...Object.fromEntries(['post', 'put', 'patch', 'delete'].map(method => [method, { responses: { '405': { description: 'API de solo lectura', headers: { Allow: { schema: { type: 'string' } } }, content: { 'application/json': { schema: { $ref: '#/components/schemas/error' } } } } } }])),
  }];
}));

writeFileSync('docs/api/openapi.json', JSON.stringify({
  openapi: '3.1.0', info: { title: 'Atlas Veterinario 3D API', version: '1.0.0', description: 'Catálogo de lectura. Revisión humana y activos pendientes se declaran explícitamente. Parámetros desconocidos o repetidos: 400.' },
  paths: operations, components: { schemas: { ...components, error: schemaJson(errorSchema) } },
}, null, 2) + '\n');
console.log('OpenAPI generado en docs/api/openapi.json; revisar diff antes de aceptar cambios contractuales.');
