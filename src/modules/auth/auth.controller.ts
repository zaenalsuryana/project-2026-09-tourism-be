import { Controller, Post, Body, Get, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Mendaftarkan pengguna baru (Tourist)' })
  @ApiResponse({ status: 201, description: 'Pengguna berhasil didaftarkan dan cookie diset' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: result.message,
      accessToken: result.accessToken,
      data: result.data,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login pengguna' })
  @ApiResponse({ status: 200, description: 'Login berhasil dan cookie diset' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Login menggunakan akun Google' })
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Callback redirect dari Google setelah login' })
  async googleAuthRedirect(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.validateGoogleUser(req.user);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: result.message,
      accessToken: result.accessToken,
      data: result.data,
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Kirim link reset password ke email' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Eksekusi reset password menggunakan token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan profil lengkap user yang sedang login' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data profil lengkap' })
  @ApiResponse({ status: 401, description: 'Unauthorized / Token tidak valid' })
  async getProfile(@GetCurrentUser() user: any) {
    return this.authService.getProfile(user.userId);
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(UserRole.SUPER_ADMIN)         
  @ApiCookieAuth() // Menggunakan Cookie Auth di Swagger
  @ApiOperation({ summary: 'Tes akses khusus Super Admin' })
  testAdminAccess(@GetCurrentUser() user: any) {
    return {
      message: 'Selamat datang, Super Admin! Anda memiliki akses tingkat tinggi.',
      user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth() // Menggunakan Cookie Auth di Swagger
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout pengguna dan hapus cookie' })
  @ApiResponse({ status: 200, description: 'Logout berhasil' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
    });

    return {
      message: 'Logout berhasil, sesi telah dihapus.',
    };
  }
}