import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import type { AuthService } from './auth.service.js';

function contextWithHeader(authorization?: string) {
  const request: { headers: { authorization?: string }; authUser?: unknown } = {
    headers: {},
  };

  if (authorization) {
    request.headers.authorization = authorization;
  }

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    request,
  };
}

describe('AuthGuard', () => {
  const authUser = {
    clerkId: 'user_123',
    email: 'sanat@example.com',
    username: null,
  };

  it('rejects a request with no bearer token', async () => {
    const authService = {
      authenticate: vi.fn(),
    } as unknown as AuthService;
    const guard = new AuthGuard(authService);
    const { request, ...executionContext } = contextWithHeader();

    await expect(guard.canActivate(executionContext as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(request.authUser).toBeUndefined();
  });

  it('attaches the Clerk user when the token is valid', async () => {
    const authenticate = vi.fn().mockResolvedValue(authUser);
    const guard = new AuthGuard({ authenticate } as unknown as AuthService);
    const { request, ...executionContext } = contextWithHeader('Bearer session-token');

    await expect(guard.canActivate(executionContext as never)).resolves.toBe(true);
    expect(authenticate).toHaveBeenCalledWith('session-token');
    expect(request.authUser).toEqual(authUser);
  });
});
