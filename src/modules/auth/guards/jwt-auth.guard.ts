import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token akses tidak ditemukan atau format salah.');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch (error: any) {
      console.log('🚨 ALASAN TOKEN DITOLAK:', error.message);
      throw new UnauthorizedException('Token tidak valid atau sudah kedaluwarsa.');
    }

    return true;
  }
}