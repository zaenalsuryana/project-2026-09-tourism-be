import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTicketInventoryDto } from './dto/create-ticket-inventory.dto';
import { UpdateTicketInventoryDto } from './dto/update-ticket-inventory.dto';

@Injectable()
export class TicketInventoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTicketInventoryDto: CreateTicketInventoryDto) {
    const { ticketTypeId, date, quota } = createTicketInventoryDto;
    const inventoryDate = new Date(date);

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

  async findAll() {
    return this.prisma.ticketInventory.findMany({
      include: { 
        ticketType: {
          select: { name: true, price: true } 
        } 
      },
      orderBy: { date: 'desc' }, 
    });
  }

  async findOne(id: string) {
    const inventory = await this.prisma.ticketInventory.findUnique({
      where: { id },
      include: { ticketType: true },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventori tiket dengan ID ${id} tidak ditemukan.`);
    }

    return inventory;
  }

  async update(id: string, updateTicketInventoryDto: UpdateTicketInventoryDto) {
    await this.findOne(id); 

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

  async remove(id: string) {
    await this.findOne(id);
    
    return this.prisma.ticketInventory.delete({
      where: { id },
    });
  }
}