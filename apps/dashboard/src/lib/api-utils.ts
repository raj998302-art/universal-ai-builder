/**
 * Standard API response helpers for consistent JSON responses.
 */

export function successResponse(data: unknown, status: number = 200) {
  return Response.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status: number = 400,
  details?: unknown
) {
  return Response.json(
    {
      success: false,
      error: { message, ...(details ? { details } : {}) },
    },
    { status }
  );
}

export function notFoundResponse(resource: string = 'Resource') {
  return errorResponse(`${resource} not found`, 404);
}

export function validationError(message: string, fields?: Record<string, string>) {
  return errorResponse(message, 422, fields ? { fields } : undefined);
}

export function serverError(message: string = 'Internal server error') {
  return errorResponse(message, 500);
}

/**
 * Validate that required fields are present in a request body.
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
}

/**
 * Parse and validate JSON request body.
 */
export async function parseBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Get client IP address from request headers.
 */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  return realIp || null;
}
