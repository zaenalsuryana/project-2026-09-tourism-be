import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpsertDestinationTransportDto } from './dto/upsert-transport.dto';

@Injectable()
export class DestinationTransportsService {
  constructor(private readonly prisma: PrismaService) {}

  // Upsert (Create / Update) info transportasi khusus Manajer/Admin
  async upsertTransport(destinationId: string, dto: UpsertDestinationTransportDto, userDestinationId?: string, userRole?: string) {
    // Validasi kepemilikan jika yang mengakses adalah MANAGER
    if (userRole === 'MANAGER' && userDestinationId && userDestinationId !== destinationId) {
      throw new ForbiddenException('Anda tidak diizinkan mengubah informasi transportasi destinasi lain.');
    }

    // Pastikan destinasi ada
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan.');
    }

    return this.prisma.destinationTransport.upsert({
      where: { destinationId },
      update: {
        publicTransitGuide: dto.publicTransitGuide,
        nearestStation: dto.nearestStation,
        estimatedTime: dto.estimatedTime,
        tips: dto.tips,
      },
      create: {
        destinationId,
        publicTransitGuide: dto.publicTransitGuide,
        nearestStation: dto.nearestStation,
        estimatedTime: dto.estimatedTime,
        tips: dto.tips,
      },
    });
  }

  // Ambil info transportasi berdasarkan destinasi (Publik)
  async getTransportByDestination(destinationId: string) {
    const transport = await this.prisma.destinationTransport.findUnique({
      where: { destinationId },
    });

    if (!transport) {
      throw new NotFoundException('Informasi transportasi untuk destinasi ini belum tersedia.');
    }

    return transport;
  }
}