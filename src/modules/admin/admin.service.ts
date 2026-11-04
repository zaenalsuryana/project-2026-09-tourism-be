import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DestinationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true, // <--- Sudah diubah dari 'name' menjadi 'fullName'
        role: true,
        createdAt: true,
      },
    });
  }

  // Ubah pencarian dari PENDING menjadi PENDING_REVIEW
  async getPendingDestinations() {
    return this.prisma.destination.findMany({
      where: { status: DestinationStatus.PENDING_REVIEW }, 
    });
  }

  async updateDestinationStatus(destinationId: string, status: DestinationStatus) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi wisata tidak ditemukan');
    }

    return this.prisma.destination.update({
      where: { id: destinationId },
      data: { status },
    });
  }

  async suspendDestination(destinationId: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi wisata tidak ditemukan');
    }

    return this.prisma.destination.update({
      where: { id: destinationId },
      data: { status: DestinationStatus.SUSPENDED },
    });
  }
}