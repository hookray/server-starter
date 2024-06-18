import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private logger = new Logger(HttpExceptionFilter.name);
    catch(exception: HttpException, host: ArgumentsHost) {
        const request = host.switchToHttp().getRequest<Request>();
        const response = host.switchToHttp().getResponse<Response>();
        const status = exception.getStatus();
        let resp = exception.getResponse();
        let message = '';
        if (resp['message']) {
            if (Array.isArray(resp['message'])) {
                message = resp['message'][0];
            } else {
                message = resp['message'];
            }
        }
        this.logger.error(`
            ${request.ip} ${request.method} ${request.url} ${status} ${message}
            \nbody: ${JSON.stringify(request.body)}
            \nquery: ${JSON.stringify(request.query)}
            \nparams: ${JSON.stringify(request.params)}
            `)
        const errorResponse = {
            code: status,
            message,
            path: request.url,
            method: request.method,
            timestamp: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
            success: false
        }
        return response.status(200).json(errorResponse);
    }
}