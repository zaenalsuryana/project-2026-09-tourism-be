import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

@Injectable()
export class TicketTypesService {
  constructor(private prisma: PrismaService) {}

  // Membuat jenis tiket baru untuk destinasi tertentu
  async create(destinationId: string, userId: string, dto: CreateTicketTypeDto) {
    return this.prisma.ticketType.create({
      data: {
        destinationId,
        createdById: userId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        dailyQuota: dto.dailyQuota,
        minPerOrder: dto.minPerOrder ?? 1,
        maxPerOrder: dto.maxPerOrder ?? 10,
        salesStartAt: dto.salesStartAt ? new Date(dto.salesStartAt) : null,
        salesEndAt: dto.salesEndAt ? new Date(dto.salesEndAt) : null,
      },
    });
  }

  // Mengambil daftar jenis tiket berdasarkan destinasi
  async findAllByDestination(destinationId: string) {
    return this.prisma.ticketType.findMany({
      where: {
        destinationId,
        deletedAt: null, // Hanya ambil yang belum dihapus
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Mengambil detail satu jenis tiket
  async findOne(id: string, destinationId: string) {
    const ticketType = await this.prisma.ticketType.findFirst({
      where: { id, destinationId, deletedAt: null },
    });

    if (!ticketType) {
      throw new NotFoundException('Jenis tiket tidak ditemukan');
    }

    return ticketType;
  }

  // Memperbarui jenis tiket
  async update(id: string, destinationId: string, dto: UpdateTicketTypeDto) {
    // Pastikan tiket ada dan milik destinasi tersebut
    await this.findOne(id, destinationId);

    return this.prisma.ticketType.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        dailyQuota: dto.dailyQuota,
        minPerOrder: dto.minPerOrder,
        maxPerOrder: dto.maxPerOrder,
        salesStartAt: dto.salesStartAt ? new Date(dto.salesStartAt) : undefined,
        salesEndAt: dto.salesEndAt ? new Date(dto.salesEndAt) : undefined,
      },
    });
  }

  // Soft delete jenis tiket (sesuai aturan bisnis: tidak dihapus permanen jika sudah terikat riwayat)
  async remove(id: string, destinationId: string) {
    await this.findOne(id, destinationId);

    return this.prisma.ticketType.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}