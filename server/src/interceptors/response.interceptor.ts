import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map } from "rxjs";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(ctx: ExecutionContext, next: CallHandler) {
        return next
            .handle()
            .pipe(
                map(data => ({
                    code: 200,
                    success: true,
                    message: "success",
                    data
                }))
            )
    }
}