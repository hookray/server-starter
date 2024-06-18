import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { PublicKey } from 'src/decorators/pub.decorator';
import { UserRole } from 'src/entities/user.entity';
import { RolesKey } from 'src/decorators/roles.decorator';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly reflector: Reflector
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const isPub = this.reflector.getAllAndOverride<boolean>(
      PublicKey,
      [context.getHandler(), context.getClass()]
    )
    if (isPub) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) return false;
    const payload = await this.authService.validateToken(token);
    if (!payload) return false;
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      RolesKey,
      [context.getHandler(), context.getClass()]
    )
    if (requiredRoles && !requiredRoles.includes(payload.role)) return false;
    request.user = await this.userService.findOneById(payload.sub);
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
