import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService, // Inject MailerService di sini
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

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    delete (user as any).passwordHash;

    return {
      message: 'Login berhasil',
      accessToken,
      data: user,
    };
  }

  // --- Metode Baru 1: Mengirimkan Link Reset ---
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException('Pengguna dengan email tersebut tidak ditemukan.');
    }

    // Buat token khusus reset yang hanya berlaku 15 menit
    const resetToken = this.jwtService.sign(
      { userId: user.id, action: 'reset-password' },
      { expiresIn: '15m' } 
    );

    const resetLink = `http://localhost:3000/api/auth/reset-password-form?token=${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Permintaan Reset Password - Tourism App',
        text: `Halo ${user.fullName},\n\nKami menerima permintaan untuk mereset password Anda. Klik link di bawah ini untuk membuat password baru:\n\n${resetLink}\n\nLink ini hanya berlaku selama 15 menit.`,
      });
    } catch (error) {
      console.error('Gagal mengirim email reset password:', error);
      throw new BadRequestException('Gagal mengirim email, pastikan konfigurasi SMTP benar.');
    }

    return { message: 'Link reset password telah dikirim ke email Anda.' };
  }

  // --- Metode Baru 2: Mengeksekusi Pembaruan Password ---
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(resetPasswordDto.token);

      if (payload.action !== 'reset-password') {
        throw new BadRequestException('Token tidak valid untuk aksi ini.');
      }

      const newPasswordHash = await argon2.hash(resetPasswordDto.newPassword);

      await this.prisma.user.update({
        where: { id: payload.userId },
        data: { passwordHash: newPasswordHash },
      });

      return { message: 'Password berhasil direset. Silakan login menggunakan password baru.' };
      
    } catch (error) {
      throw new BadRequestException('Token tidak valid atau sudah kedaluwarsa.');
    }
  }
}