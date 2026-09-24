import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserProfile } from '@liftup/types';

export const CurrentUser = createParamDecorator(
  (data: keyof UserProfile | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserProfile | undefined;
    if (!user) return null;
    return data ? user[data] : user;
  },
);
