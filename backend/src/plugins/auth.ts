// src/plugins/auth.ts - Enhanced with secure cookie handling and JWT refresh
import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { 
  authenticateMiddleware, 
  optionalAuthMiddleware, 
  authenticateAdminMiddleware,
  authRateLimitMiddleware 
} from '../middleware/auth.middleware';
import { jwtConfig, cookieConfig, config } from '../config/config';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

const authPlugin = async (fastify: any) => {
  // Register cookie support with secure configuration
  await fastify.register(cookie, {
    secret: cookieConfig.secret,
    parseOptions: {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      maxAge: cookieConfig.maxAge,
      path: '/',
      domain: config.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    }
  });

  // Register JWT with refresh token support
  await fastify.register(jwt, {
    secret: jwtConfig.secret,
    sign: {
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      expiresIn: jwtConfig.expiresIn
    },
    verify: {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    },
    cookie: {
      cookieName: 'access-token',
      signed: true
    }
  });

  // Register separate JWT instance for refresh tokens
  await fastify.register(jwt, {
    secret: jwtConfig.refreshSecret,
    namespace: 'refreshJwt',
    sign: {
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      expiresIn: jwtConfig.refreshExpiresIn
    },
    verify: {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    },
    cookie: {
      cookieName: 'refresh-token',
      signed: true
    }
  });

  // Register authentication middleware decorators
  fastify.decorate('authenticate', authenticateMiddleware);
  fastify.decorate('optionalAuth', optionalAuthMiddleware);  
  fastify.decorate('authenticateAdmin', authenticateAdminMiddleware);
  fastify.decorate('authRateLimit', authRateLimitMiddleware);

  // Add secure cookie helpers
  fastify.decorate('setAuthCookies', (reply: any, accessToken: string, refreshToken: string) => {
    // Set access token cookie (shorter expiry)
    reply.setCookie('access-token', accessToken, {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      signed: true
    });

    // Set refresh token cookie (longer expiry)
    reply.setCookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      maxAge: cookieConfig.maxAge, // 7 days
      path: '/api/auth/refresh',
      signed: true
    });
  });

  fastify.decorate('clearAuthCookies', (reply: any) => {
    reply.clearCookie('access-token', { path: '/' });
    reply.clearCookie('refresh-token', { path: '/api/auth/refresh' });
  });



  // Add authentication hooks for protected routes
  fastify.addHook('preHandler', async (request: any, reply: any) => {
    // Skip auth for public routes
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register', 
      '/api/auth/refresh',
      '/api/auth/password-reset',
      '/api/auth/password-reset/confirm',
      '/api/health',
      '/api/metrics',
      '/docs'
    ];

    // Skip auth for static files and Swagger UI
    if (request.url.startsWith('/static/') || 
        request.url.startsWith('/assets/') ||
        request.url.startsWith('/documentation') ||
        publicRoutes.some(route => request.url.startsWith(route))) {
      return;
    }

    // Apply rate limiting to auth routes
    if (request.url.startsWith('/api/auth/')) {
      await authRateLimitMiddleware(request, reply);
    }

    // Auto-refresh expired access tokens
    if (request.url.startsWith('/api/')) {
      const accessToken = request.cookies['access-token'];
      const refreshToken = request.cookies['refresh-token'];

      if (!accessToken && refreshToken) {
        // Try to refresh token automatically
        try {
          const decoded = await fastify.refreshJwt.verify(refreshToken);
          if (decoded.type === 'refresh') {
            const newAccessToken = await fastify.jwt.sign({
              studentId: decoded.studentId,
              email: decoded.email,
              type: 'access'
            });

            // Set new access token cookie
            reply.setCookie('access-token', newAccessToken, {
              httpOnly: true,
              secure: cookieConfig.secure,
              sameSite: cookieConfig.sameSite,
              maxAge: 15 * 60 * 1000,
              path: '/',
              signed: true
            });

            // Add user to request context
            request.user = {
              studentId: decoded.studentId,
              email: decoded.email
            };

            logger.debug('Auto-refreshed access token', { 
              studentId: decoded.studentId 
            });
          }
        } catch (error) {
          // Refresh failed, clear cookies
          fastify.clearAuthCookies(reply);
        }
      }
    }
  });



  fastify.log.info('✅ Enhanced auth plugin registered with secure cookies and refresh tokens');
};

export default fp(authPlugin, { name: 'auth' });

