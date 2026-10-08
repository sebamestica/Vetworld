import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { responseSchemas, querySchemas, errorSchema, type Endpoint } from '../src/lib/api/contracts';
import { referenceResponseSchema, referencesResponseSchema } from '../src/modules/media/schemas';

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

const mediaParameters = ['structure', 'species', 'region', 'page', 'limit'].map(name => ({ name, in: 'query', required: false, schema: { type: 'string', pattern: name === 'page' || name === 'limit' ? '^[1-9]\\d*$' : '^[a-z0-9][a-z0-9:-]*$' }, description: name === 'limit' ? '1–100; defecto 20' : name === 'page' ? '1–1.000.000; defecto 1' : 'ID de catálogo existente' }));
const mediaPaths = Object.fromEntries([['references', '/api/v1/references'], ['reference', '/api/v1/references/{id}']].map(([key, path]) => [path, {
  get: { operationId: key, summary: 'Consultar referencias científicas curadas sin hotlink', parameters: key === 'references' ? mediaParameters : [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Referencia(s) curada(s)', content: { 'application/json': { schema: { $ref: `#/components/schemas/${key}` } } } }, ...Object.fromEntries(['400', '404', '500'].map(code => [code, { description: 'Error estructurado', content: { 'application/json': { schema: { $ref: '#/components/schemas/error' } } } }])) } },
  head: { responses: { '200': { description: 'Cabeceras, sin cuerpo' } } }, options: { responses: { '204': { description: 'GET, HEAD, OPTIONS' } } },
  ...Object.fromEntries(['post', 'put', 'patch', 'delete'].map(method => [method, { responses: { '405': { description: 'Solo lectura', content: { 'application/json': { schema: { $ref: '#/components/schemas/error' } } } } } }])),
}]));

writeFileSync('docs/api/openapi.json', JSON.stringify({
  openapi: '3.1.0', info: { title: 'Atlas Veterinario 3D API', version: '1.1.0', description: 'Catálogo de lectura. Revisión humana y activos pendientes se declaran explícitamente. Parámetros desconocidos o repetidos: 400.' },
  paths: { ...operations, ...mediaPaths }, components: { schemas: { ...components, references: schemaJson(referencesResponseSchema), reference: schemaJson(referenceResponseSchema), error: schemaJson(errorSchema) } },
}, null, 2) + '\n');
console.log('OpenAPI generado en docs/api/openapi.json; revisar diff antes de aceptar cambios contractuales.');
