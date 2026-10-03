import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper untuk membuat slug otomatis dari nama destinasi
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  // Helper untuk memastikan slug unik di database
  private async getUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    let exists = await this.prisma.destination.findUnique({ where: { slug } });

    while (exists) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      exists = await this.prisma.destination.findUnique({ where: { slug } });
    }
    return slug;
  }

  async create(managerId: string, createDestinationDto: CreateDestinationDto) {
    // 1. Cek apakah manager ini sudah memiliki destinasi
    const existingDestination = await this.prisma.destination.findUnique({
      where: { managerId },
    });

    if (existingDestination) {
      throw new ConflictException('DESTINATION_ALREADY_EXISTS: Anda sudah mendaftarkan destinasi wisata.');
    }

    // 2. Buat slug yang unik
    const baseSlug = this.generateSlug(createDestinationDto.name);
    const uniqueSlug = await this.getUniqueSlug(baseSlug);

    // 3. Simpan ke database dengan status DRAFT
    const destination = await this.prisma.destination.create({
      data: {
        ...createDestinationDto,
        managerId,
        slug: uniqueSlug,
        status: 'DRAFT',
      },
    });

    return {
      message: 'Berhasil mendaftarkan destinasi baru',
      data: destination,
    };
  }

  async findAll() {
    return this.prisma.destination.findMany({
      include: { category: true },
    });
  }

  async findOne(id: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan.');
    }

    return destination;
  }

  async update(id: string, updateDestinationDto: UpdateDestinationDto) {
    return `This action updates a #${id} destination`;
  }

  async remove(id: string) {
    return `This action removes a #${id} destination`;
  }
}