import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'];

    if (!user) {
      throw new ForbiddenException('Foydalanuvchi ma’lumotlari topilmadi');
    }

    const hasRole = this.checkUserRole(requiredRoles, user.role);
    const isOwner = this.checkOwnership(
      requiredRoles,
      user.id,
      request.params.id,
    );

    if (hasRole || isOwner) {
      return true;
    }

    throw new ForbiddenException('Ruxsat etilmagan: huquqlar yetarli emas');
  }

  private checkUserRole(requiredRoles: string[], userRole: string): boolean {
    if (!userRole) return false;

    return requiredRoles
      .filter((role) => role !== 'ID')
      .some((role) => role.toUpperCase() === userRole.toUpperCase());
  }

  private checkOwnership(
    requiredRoles: string[],
    userId: string,
    paramId: string,
  ): boolean {
    return requiredRoles.includes('ID') && userId === paramId;
  }
}
