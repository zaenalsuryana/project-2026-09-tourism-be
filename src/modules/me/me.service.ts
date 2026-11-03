import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
// Sesuaikan jalur import PrismaService dengan lokasi foldermu (misal: '../../common/prisma/prisma.service')
import { PrismaService } from '../../common/prisma/prisma.service'; 
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class MeService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        identities: {
          select: { provider: true, providerEmail: true, createdAt: true },
        },
        managedDestination: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      birthDate: user.birthDate,
      city: user.city,
      role: user.role,
      status: user.status,
      emailVerified: !!user.emailVerifiedAt,
      destinationId: user.managedDestination?.id || null,
      identities: user.identities,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.birthDate && { birthDate: new Date(dto.birthDate) }),
        ...(dto.city && { city: dto.city }),
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        birthDate: true,
        city: true,
        updatedAt: true,
      },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
  }

  async getIdentities(userId: string) {
    return this.prisma.userIdentity.findMany({
      where: { userId },
      select: { provider: true, providerEmail: true, createdAt: true },
    });
  }

  async removeIdentity(userId: string, provider: string) {
    const identities = await this.prisma.userIdentity.findMany({ where: { userId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Syarat: minimal masih tersisa 1 metode login (password atau provider lain)
    if (identities.length <= 1 && !user?.passwordHash) {
      throw new ConflictException('Tidak dapat melepas metode login terakhir');
    }

    await this.prisma.userIdentity.delete({
      where: {
        userId_provider: {
          userId,
          provider: provider as any,
        },
      },
    });

    return { message: 'Identitas OAuth berhasil dilepas' };
  }

  async getWishlists(userId: string) {
    // Catatan: Jika model Wishlist belum ada di schema.prisma, pastikan ditambahkan dulu. 
    // Berdasarkan skema terakhir, jika wishlist belum didefinisikan di prisma, bisa ditambahkan modelnya.
    return (this.prisma as any).wishlist.findMany({
      where: { userId },
      include: {
        destination: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            province: true,
            status: true,
            images: {
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addWishlist(userId: string, destinationId: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination || destination.status !== 'PUBLISHED') {
      throw new NotFoundException('Destinasi tidak ditemukan atau belum dipublikasikan');
    }

    return (this.prisma as any).wishlist.upsert({
      where: {
        userId_destinationId: { userId, destinationId },
      },
      update: {},
      create: { userId, destinationId },
    });
  }

  async removeWishlist(userId: string, destinationId: string) {
    await (this.prisma as any).wishlist.deleteMany({
      where: { userId, destinationId },
    });
    return { message: 'Destinasi berhasil dihapus dari wishlist' };
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        destination: { select: { name: true, slug: true, city: true } },
        items: true,
        tickets: { select: { ticketCode: true, status: true, visitDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}