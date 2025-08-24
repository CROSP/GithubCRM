import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '@presentation/context/user.context';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new Error('User not found in request. Make sure JWT guard is applied.');
    }

    return {
      userId: user.sub || user.id || user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles || [],
      permissions: user.permissions || [],
      isActive: user.isActive !== undefined ? user.isActive : true,
    };
  },
);
