import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Prioritas 1: Ambil dari Header Authorization Bearer (Paling aman untuk Swagger)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Prioritas 2: Ambil dari Cookie (Untuk Frontend/Browser asli nantinya)
        (request: Request) => {
          return request?.cookies?.accessToken || request?.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'rahasia-super-aman-pariwisata-2026',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }
}