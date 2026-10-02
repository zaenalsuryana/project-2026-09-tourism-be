import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper untuk membuat slug otomatis dari nama kategori
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Ganti spasi/karakter khusus dengan strip
      .replace(/(^-|-$)+/g, '');   // Hapus strip di awal atau akhir
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const { name } = createCategoryDto;
    const slug = this.generateSlug(name);

    // Cek apakah kategori dengan nama atau slug yang sama sudah ada
    const existingCategory = await this.prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });

    if (existingCategory) {
      throw new ConflictException('Kategori dengan nama tersebut sudah ada.');
    }

    const category = await this.prisma.category.create({
      data: { name, slug },
    });

    return {
      message: 'Berhasil membuat kategori baru',
      data: category,
    };
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' }, // Urutkan sesuai abjad
    });

    return {
      message: 'Berhasil mengambil daftar kategori',
      data: categories,
    };
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan.`);
    }

    return {
      message: 'Berhasil mengambil detail kategori',
      data: category,
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    // Pastikan kategori yang mau diubah ada
    await this.findOne(id); 

    const dataToUpdate: any = { ...updateCategoryDto };

    // Jika nama diubah, perbarui juga slug-nya
    if (updateCategoryDto.name) {
      dataToUpdate.slug = this.generateSlug(updateCategoryDto.name);
      
      // Cek apakah nama baru bentrok dengan kategori lain
      const existing = await this.prisma.category.findFirst({
        where: {
          name: updateCategoryDto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Nama kategori sudah digunakan oleh kategori lain.');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      message: 'Berhasil memperbarui kategori',
      data: category,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Kategori berhasil dihapus',
    };
  }
}