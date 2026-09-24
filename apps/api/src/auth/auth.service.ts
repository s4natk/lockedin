import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import type { AuthUser } from './auth.types.js';

@Injectable()
export class AuthService {
  private readonly secretKey = process.env.CLERK_SECRET_KEY;
  private readonly clerk = this.secretKey
    ? createClerkClient({ secretKey: this.secretKey })
    : null;

  async authenticate(token: string): Promise<AuthUser> {
    if (!this.secretKey || !this.clerk) {
      throw new UnauthorizedException();
    }

    let clerkId: string;

    try {
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
        authorizedParties: [process.env.FRONTEND_URL ?? 'http://localhost:3000'],
      });
      clerkId = payload.sub;
    } catch {
      throw new UnauthorizedException();
    }

    const clerkUser = await this.clerk.users.getUser(clerkId);
    const email = clerkUser.emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;

    if (!email) {
      throw new UnauthorizedException();
    }

    return {
      clerkId,
      email,
      username: clerkUser.username,
    };
  }
}
