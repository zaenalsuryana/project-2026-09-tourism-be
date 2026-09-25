import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar, silakan gunakan email lain.');
    }

    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: 'TOURIST',
      },
    });

    delete (user as any).passwordHash;

    return {
      message: 'Registrasi berhasil',
      data: user,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    // 2. Cocokkan password dengan Argon2
    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    // 3. Buat payload untuk JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // 4. Generate token (berlaku 7 hari)
    const accessToken = this.jwtService.sign(payload);

    delete (user as any).passwordHash;

    return {
      message: 'Login berhasil',
      accessToken,
      data: user,
    };
  }
}