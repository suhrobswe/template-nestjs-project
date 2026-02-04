import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response, CookieOptions } from 'express';
import { IToken } from '../interface/interface';
import { config } from 'src/config';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(payload: IToken): Promise<string> {
    return this.signToken(
      payload,
      config.TOKEN.ACCESS_TOKEN_KEY,
      config.TOKEN.ACCESS_TOKEN_TIME,
    );
  }

  async generateRefreshToken(payload: IToken): Promise<string> {
    return this.signToken(
      payload,
      config.TOKEN.REFRESH_TOKEN_KEY,
      config.TOKEN.REFRESH_TOKEN_TIME,
    );
  }

  async verifyToken(token: string, secret: string): Promise<any> {
    return this.jwtService.verifyAsync(token, { secret });
  }

  async setCookie(
    res: Response,
    key: string,
    value: string,
    days: number,
  ): Promise<void> {
    const options: CookieOptions = {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: days * 24 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie(key, value, options);
  }

  async clearCookie(res: Response, key: string): Promise<void> {
    res.clearCookie(key, { path: '/' });
  }

  private async signToken(
    payload: IToken,
    secret: string,
    expiresInDays: number,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: `${expiresInDays}d`,
    });
  }
}
