import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Import menggunakan custom output Prisma
import { UserRole } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Mendaftarkan pengguna baru (Tourist)' })
  @ApiResponse({ status: 201, description: 'Pengguna berhasil didaftarkan' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login pengguna' })
  @ApiResponse({ status: 200, description: 'Login berhasil, mengembalikan token' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan profil user yang sedang login (Butuh Token)' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data profil' })
  @ApiResponse({ status: 401, description: 'Unauthorized / Token tidak valid' })
  getProfile(@GetCurrentUser() user: any) {
    return {
      message: 'Berhasil mengakses data dengan token JWT',
      user,
    };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(UserRole.SUPER_ADMIN)         
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tes akses khusus Super Admin' })
  @ApiResponse({ status: 200, description: 'Berhasil diakses oleh Super Admin' })
  @ApiResponse({ status: 403, description: 'Forbidden / Akses ditolak' })
  testAdminAccess(@GetCurrentUser() user: any) {
    return {
      message: 'Selamat datang, Super Admin! Anda memiliki akses tingkat tinggi.',
      user,
    };
  }
  @Post('forgot-password')
  @ApiOperation({ summary: 'Kirim link reset password ke email' })
  @ApiResponse({ status: 200, description: 'Link reset password berhasil dikirim' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Eksekusi reset password menggunakan token' })
  @ApiResponse({ status: 200, description: 'Password berhasil diubah' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}