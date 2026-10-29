import { ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTicketInventoryDto } from './dto/create-ticket-inventory.dto';
import { UpdateTicketInventoryDto } from './dto/update-ticket-inventory.dto';

@Injectable()
export class TicketInventoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTicketInventoryDto: CreateTicketInventoryDto, destinationId?: string) {
    const { ticketTypeId, date, quota } = createTicketInventoryDto;
    const inventoryDate = new Date(date);

    // 1. Validasi apakah ticketTypeId ini benar milik destinasi si manajer (jika bukan Super Admin)
    if (destinationId) {
      const ticketType = await this.prisma.ticketType.findUnique({
        where: { id: ticketTypeId },
      });
      if (!ticketType || ticketType.destinationId !== destinationId) {
        throw new ForbiddenException('Anda tidak dapat membuat inventori untuk jenis tiket di luar destinasi Anda.');
      }
    }

    const existingInventory = await this.prisma.ticketInventory.findUnique({
      where: {
        ticketTypeId_date: {
          ticketTypeId,
          date: inventoryDate,
        },
      },
    });

    if (existingInventory) {
      throw new ConflictException('Kuota inventori untuk jenis tiket dan tanggal ini sudah ada.');
    }

    return this.prisma.ticketInventory.create({
      data: {
        ticketTypeId,
        date: inventoryDate,
        quota,
      },
    });
  }

  async findAll(destinationId?: string, ticketTypeId?: string) {
    // Filter berdasarkan destinationId (melalui relasi ticketType) dan opsional ticketTypeId
    const whereClause: any = {};

    if (ticketTypeId) {
      whereClause.ticketTypeId = ticketTypeId;
    }

    if (destinationId) {
      whereClause.ticketType = {
        destinationId: destinationId,
      };
    }

    return this.prisma.ticketInventory.findMany({
      where: whereClause,
      orderBy: { 
        date: 'desc',
      },
      include: {
        ticketType: {
          select: {
            name: true,
            price: true,
            destinationId: true,
          },
        },
      },
    });
  }

  async findOne(id: string, destinationId?: string) {
    const inventory = await this.prisma.ticketInventory.findUnique({
      where: { id },
      include: { ticketType: true },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventori tiket dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi kepemilikan destinasi
    if (destinationId && inventory.ticketType.destinationId !== destinationId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke inventori destinasi ini.');
    }

    return inventory;
  }

  async update(id: string, destinationId: string, updateTicketInventoryDto: UpdateTicketInventoryDto) {
    // Pastikan data ada dan milik destinasi yang bersangkutan
    await this.findOne(id, destinationId);

    const { date, ...restData } = updateTicketInventoryDto;
    const dataToUpdate: any = { ...restData };

    if (date) {
      dataToUpdate.date = new Date(date);
    }

    try {
      return await this.prisma.ticketInventory.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Kombinasi jenis tiket dan tanggal ini sudah digunakan pada inventori lain.');
      }
      throw error;
    }
  }

  async remove(id: string, destinationId?: string) {
    // Pastikan data ada dan milik destinasi yang bersangkutan
    await this.findOne(id, destinationId);
    
    return this.prisma.ticketInventory.delete({
      where: { id },
    });
  }
}