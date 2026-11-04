import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'; // <--- 1. Tambahkan import Swagger
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Impor Guards dan Decorator untuk Hak Akses
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Categories') // <--- 2. Mengelompokkan di Swagger
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 🔒 HANYA ADMIN & MANAGER YANG BISA MEMBUAT KATEGORI
  @Post()
  @ApiBearerAuth() // <--- 3. WAJIB ADA AGAR TOKEN DIKIRIM KE ENDPOINT YANG DILINDUNGI
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Membuat kategori destinasi wisata baru (Admin/Manager)' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  // 🌍 BISA DIAKSES PUBLIK / TOURIST (Tidak butuh token)
  @Get()
  @ApiOperation({ summary: 'Melihat seluruh daftar kategori (Publik)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  // 🌍 BISA DIAKSES PUBLIK / TOURIST (Tidak butuh token)
  @Get(':id')
  @ApiOperation({ summary: 'Melihat detail kategori berdasarkan ID (Publik)' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  // 🔒 HANYA ADMIN & MANAGER YANG BISA MENGUBAH KATEGORI
  @Patch(':id')
  @ApiBearerAuth() // <--- WAJIB ADA
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Memperbarui data kategori (Admin/Manager)' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  // 🔒 HANYA ADMIN & MANAGER YANG BISA MENGHAPUS KATEGORI
  @Delete(':id')
  @ApiBearerAuth() // <--- WAJIB ADA
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Menghapus kategori (Admin/Manager)' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}