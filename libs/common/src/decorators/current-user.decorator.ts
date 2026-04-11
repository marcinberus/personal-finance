import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

// https://docs.nestjs.com/custom-decorators
export const CurrentUser = createParamDecorator(
  (_, executionContext: ExecutionContext): AuthenticatedUser => {
    const request = executionContext
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
