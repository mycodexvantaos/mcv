/**
 * Cloudflare Pages Middleware for MyCodeXvantaOS
 * Handles security headers, CORS, and request routing
 */

export const onRequest: PagesFunction = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Security headers
  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.cloudflare.com https://*.autoecoops.io",
      "frame-ancestors 'none'",
    ].join('; '),
  };

  // Handle CORS for API routes
  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin':
            env.ENVIRONMENT === 'production' ? 'https://admin.autoecoops.io' : '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
          ...securityHeaders,
        },
      });
    }

    const response = await next();
    const newResponse = new Response(response.body, response);

    Object.entries(securityHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    newResponse.headers.set(
      'Access-Control-Allow-Origin',
      env.ENVIRONMENT === 'production' ? 'https://admin.autoecoops.io' : '*'
    );

    return newResponse;
  }

  // Apply security headers to all responses
  const response = await next();
  const newResponse = new Response(response.body, response);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
};
