import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';

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
}