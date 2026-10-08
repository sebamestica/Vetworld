import { ApiError } from '@/lib/errors/api-error';
import { errorResponse, options } from '@/lib/api/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;
export const GET = () => errorResponse(new ApiError(404, 'NOT_FOUND', 'Ruta de API inexistente'));
export const HEAD = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
export const OPTIONS = options;
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
