import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Request } from "express";

export const Cur = createParamDecorator((data: string, req: ExecutionContextHost) => {
    const request: Request = req.switchToHttp().getRequest();
    if (data) return request.user?.[data];
    return request.user;
})