import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { config } from 'src/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token topilmadi yoki xato formatda');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: config.TOKEN.ACCESS_TOKEN_KEY,
      });

      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token yaroqsiz yoki muddati o’tgan');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
