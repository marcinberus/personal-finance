import { createParamDecorator, ExecutionContext } from "@nestjs/common";

// https://docs.nestjs.com/custom-decorators
export const CurrentUser = createParamDecorator(
    (_, executionContext: ExecutionContext) => {
        const request = executionContext.switchToHttp().getRequest();
        return request.user
    }
);