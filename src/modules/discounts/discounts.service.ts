import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service'; // Mengikuti path dari ticket-inventories
import { CreateDiscountDto } from './dto/create-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDiscount(destinationId: string, dto: CreateDiscountDto) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const existingDiscount = await this.prisma.discount.findUnique({
      where: {
        destinationId_code: {
          destinationId,
          code: dto.code.toUpperCase(),
        },
      },
    });

    if (existingDiscount) {
      throw new ConflictException('Kode diskon sudah ada untuk destinasi ini');
    }

    return this.prisma.discount.create({
      data: {
        destinationId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount ?? 0,
        maxDiscountAmount: dto.maxDiscountAmount,
        quota: dto.quota,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async getDiscountsByDestination(destinationId: string) {
    return this.prisma.discount.findMany({
      where: {
        destinationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}