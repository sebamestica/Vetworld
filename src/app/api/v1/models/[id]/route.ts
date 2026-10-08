import { createHandler, createHeadHandler } from '@/lib/api/handler';
import { methodNotAllowed, options } from '@/lib/api/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;
export const GET = createHandler('model');
export const HEAD = createHeadHandler(GET);
export const OPTIONS = options;
export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
