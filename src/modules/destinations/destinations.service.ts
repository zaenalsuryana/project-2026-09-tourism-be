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

  // ====================================================================
  // FITUR BARU: Mendapatkan ketersediaan tiket berdasarkan tanggal (Customer API)
  // ====================================================================
  async getAvailability(slug: string, dateString: string) {
    // 1. Cari destinasi berdasarkan slug
    const destination = await this.prisma.destination.findUnique({
      where: { slug },
      select: { id: true, isSalesOpen: true, status: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    // 2. Ambil semua jenis tiket yang aktif untuk destinasi ini
    const ticketTypes = await this.prisma.ticketType.findMany({
      where: {
        destinationId: destination.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    // 3. Ambil data inventori untuk tanggal yang diminta
    const visitDate = new Date(dateString);
    const inventories = await this.prisma.ticketInventory.findMany({
      where: {
        date: visitDate, // Menggunakan 'date' sesuai skema aslimu
        ticketTypeId: { in: ticketTypes.map((t) => t.id) },
      },
    });

    // 4. Gabungkan data tiket dengan data inventori untuk menghitung sisa kuota
    const availability = ticketTypes.map((ticket) => {
      // Cari apakah ada data inventori untuk tiket ini di tanggal tersebut
      const inventory = inventories.find((inv) => inv.ticketTypeId === ticket.id);
      
      const sold = inventory?.sold || 0;
      const quota = inventory?.quota || 0; // Mengambil quota dari tabel inventory

      // Hitung sisa kuota (remaining)
      const remaining = Math.max(quota - sold, 0); // Pastikan tidak minus

      return {
        ticketTypeId: ticket.id,
        name: ticket.name,
        price: ticket.price,
        quota,
        sold,
        remaining, // Sisa tiket yang bisa dibeli
      };
    });

    return {
      destinationId: destination.id,
      visitDate: dateString,
      tickets: availability,
    };
  }
  // ====================================================================

  async update(id: string, updateDestinationDto: UpdateDestinationDto) {
    return `This action updates a #${id} destination`;
  }

  async remove(id: string) {
    return `This action removes a #${id} destination`;
  }
}