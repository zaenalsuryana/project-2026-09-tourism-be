import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Impor Guards dan Decorator untuk Hak Akses
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Sesuaikan path ini jika berbeda
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 🔒 HANYA ADMIN & MANAGER YANG BISA MEMBUAT KATEGORI
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  // 🌍 BISA DIAKSES PUBLIK / TOURIST
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // 🌍 BISA DIAKSES PUBLIK / TOURIST
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  // 🔒 HANYA ADMIN & MANAGER YANG BISA MENGUBAH KATEGORI
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  // 🔒 HANYA ADMIN & MANAGER YANG BISA MENGHAPUS KATEGORI
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}