import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Mendaftarkan pengguna baru (Tourist)' })
  @ApiResponse({ status: 201, description: 'Pengguna berhasil didaftarkan' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto); // Memanggil logika database
  }

  @Post('login')
  @ApiOperation({ summary: 'Login pengguna' })
  @ApiResponse({ status: 200, description: 'Login berhasil, mengembalikan token' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}