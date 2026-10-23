import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
import { CreateCapacityOverrideDto } from './dto/create-capacity-override.dto'; // 👈 Import ini
import { resolveCrowd } from './crowd.util';

@Injectable()
export class CapacityService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper untuk mencari destinasi dari destinationId atau managerId (userId)
  private async findDestination(destinationId?: string, userId?: string) {
    if (!destinationId && !userId) {
      throw new BadRequestException('ID Destinasi atau ID User tidak ditemukan');
    }

    const dest = await this.prisma.destination.findFirst({
      where: {
        OR: [
          ...(destinationId ? [{ id: destinationId }] : []),
          ...(userId ? [{ managerId: userId }] : []),
        ],
      },
    });

    if (!dest) {
      throw new NotFoundException('Destinasi tidak ditemukan atau akun ini belum memiliki destinasi');
    }

    return dest;
  }

  // 1. Ambil Pengaturan Kapasitas
  async getCapacity(destinationId?: string, userId?: string) {
    const dest = await this.findDestination(destinationId, userId);

    const thresholds =
      dest.crowdThresholdUnit &&
      dest.crowdModerateFrom !== null &&
      dest.crowdBusyFrom !== null &&
      dest.crowdVeryBusyFrom !== null
        ? ([
            dest.crowdModerateFrom,
            dest.crowdBusyFrom,
            dest.crowdVeryBusyFrom,
          ] as [number, number, number])
        : null;

    const crowdInfo = resolveCrowd({
      occupied: 0,
      limit: dest.dailyVisitorLimit,
      referenceCapacity: dest.crowdReferenceCapacity,
      thresholdUnit: dest.crowdThresholdUnit,
      thresholds,
    });

    return {
      message: 'Berhasil mengambil data kapasitas destinasi',
      data: {
        dailyVisitorLimit: dest.dailyVisitorLimit,
        isLimited: dest.dailyVisitorLimit !== null,
        crowdReferenceCapacity: dest.crowdReferenceCapacity,
        thresholdSource: thresholds ? 'MANUAL' : 'AUTO',
        thresholdUnit: dest.crowdThresholdUnit || 'PERCENT',
        effectiveThresholds: crowdInfo.thresholds,
      },
    };
  }

  // 2. Update Pengaturan Kapasitas
  async updateCapacity(dto: UpdateCapacityDto, destinationId?: string, userId?: string) {
    const dest = await this.findDestination(destinationId, userId);

    let thresholdUnit = dest.crowdThresholdUnit;
    let moderateFrom = dest.crowdModerateFrom;
    let busyFrom = dest.crowdBusyFrom;
    let veryBusyFrom = dest.crowdVeryBusyFrom;

    const limit =
      dto.dailyVisitorLimit !== undefined
        ? dto.dailyVisitorLimit
        : dest.dailyVisitorLimit;

    if (dto.resetThresholds) {
      thresholdUnit = null;
      moderateFrom = null;
      busyFrom = null;
      veryBusyFrom = null;
    } else if (dto.thresholds) {
      const {
        unit,
        moderateFrom: mod,
        busyFrom: busy,
        veryBusyFrom: vBusy,
      } = dto.thresholds;

      if (!(mod < busy && busy < vBusy)) {
        throw new UnprocessableEntityException({
          code: 'CROWD_THRESHOLD_INVALID',
          message:
            'Urutan ambang keramaian tidak valid (Moderate < Busy < VeryBusy)',
        });
      }

      if (unit === 'PERCENT' && vBusy > 99) {
        throw new UnprocessableEntityException({
          code: 'CROWD_THRESHOLD_INVALID',
          message: 'Ambang persentase maksimal 99%',
        });
      }

      if (unit === 'VISITORS' && limit !== null && vBusy >= limit) {
        throw new UnprocessableEntityException({
          code: 'CROWD_THRESHOLD_INVALID',
          message: 'Ambang VeryBusy harus di bawah batas harian pengunjung',
        });
      }

      thresholdUnit = unit;
      moderateFrom = mod;
      busyFrom = busy;
      veryBusyFrom = vBusy;
    }

    const updated = await this.prisma.destination.update({
      where: { id: dest.id },
      data: {
        dailyVisitorLimit: limit,
        crowdReferenceCapacity:
          dto.crowdReferenceCapacity !== undefined
            ? dto.crowdReferenceCapacity
            : dest.crowdReferenceCapacity,
        crowdThresholdUnit: thresholdUnit,
        crowdModerateFrom: moderateFrom,
        crowdBusyFrom: busyFrom,
        crowdVeryBusyFrom: veryBusyFrom,
      },
    });

    return this.getCapacity(updated.id);
  }

  // 3. Ringkasan Dashboard Hari Ini
  async getTodayDashboard(destinationId?: string, userId?: string) {
    const todayStr = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Jakarta',
    });
    const todayDate = new Date(todayStr);

    const dest = await this.findDestination(destinationId, userId);

    const occupancy =
      await this.prisma.destinationDailyOccupancy.findUnique({
        where: {
          destinationId_visitDate: {
            destinationId: dest.id,
            visitDate: todayDate,
          },
        },
      });

    const occupied = (occupancy?.sold || 0) + (occupancy?.reserved || 0);
    const checkedIn = occupancy?.checkedIn || 0;

    const thresholds =
      dest.crowdThresholdUnit &&
      dest.crowdModerateFrom !== null &&
      dest.crowdBusyFrom !== null &&
      dest.crowdVeryBusyFrom !== null
        ? ([
            dest.crowdModerateFrom,
            dest.crowdBusyFrom,
            dest.crowdVeryBusyFrom,
          ] as [number, number, number])
        : null;

    const crowdInfo = resolveCrowd({
      occupied,
      limit: dest.dailyVisitorLimit,
      referenceCapacity: dest.crowdReferenceCapacity,
      thresholdUnit: dest.crowdThresholdUnit,
      thresholds,
    });

    return {
      message: 'Berhasil mengambil data dashboard hari ini',
      data: {
        date: todayStr,
        occupied,
        checkedIn,
        remaining: crowdInfo.remaining,
        capacity: crowdInfo.capacity,
        isLimited: crowdInfo.isLimited,
        crowdLevel: crowdInfo.level,
        crowdLabel: crowdInfo.label,
        percentage: crowdInfo.percentage,
      },
    };
  }

  // 4. Kalender Keramaian Publik untuk Wisatawan
  async getPublicCrowd(
    slug: string,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    const dest = await this.prisma.destination.findUnique({
      where: { slug },
    });

    if (!dest) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const todayStr = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Jakarta',
    });

    const start = startDateStr ? new Date(startDateStr) : new Date(todayStr);
    const end = endDateStr
      ? new Date(endDateStr)
      : new Date(new Date(start).setDate(start.getDate() + 6));

    const occupancies = await this.prisma.destinationDailyOccupancy.findMany({
      where: {
        destinationId: dest.id,
        visitDate: {
          gte: start,
          lte: end,
        },
      },
    });

    const occupancyMap = new Map(
      occupancies.map((o) => [
        o.visitDate.toISOString().split('T')[0],
        (o.sold || 0) + (o.reserved || 0),
      ]),
    );

    const paidOrders = await this.prisma.order.findMany({
      where: {
        destinationId: dest.id,
        visitDate: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['PAID', 'SUCCESS', 'COMPLETED'],
        },
      },
      select: {
        visitDate: true,
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const orderOccupancyMap = new Map<string, number>();
    paidOrders.forEach((ord) => {
      const dateKey = ord.visitDate.toISOString().split('T')[0];
      const totalQty = ord.items.reduce((sum, item) => sum + item.quantity, 0);
      orderOccupancyMap.set(
        dateKey,
        (orderOccupancyMap.get(dateKey) || 0) + totalQty,
      );
    });

    const thresholds =
      dest.crowdThresholdUnit &&
      dest.crowdModerateFrom !== null &&
      dest.crowdBusyFrom !== null &&
      dest.crowdVeryBusyFrom !== null
        ? ([
            dest.crowdModerateFrom,
            dest.crowdBusyFrom,
            dest.crowdVeryBusyFrom,
          ] as [number, number, number])
        : null;

    const calendar = [];
    const curr = new Date(start);

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      
      const dailyOccupancyVal = occupancyMap.get(dateStr) || 0;
      const orderVal = orderOccupancyMap.get(dateStr) || 0;
      const occupied = Math.max(dailyOccupancyVal, orderVal);

      const crowdInfo = resolveCrowd({
        occupied,
        limit: dest.dailyVisitorLimit,
        referenceCapacity: dest.crowdReferenceCapacity,
        thresholdUnit: dest.crowdThresholdUnit,
        thresholds,
      });

      calendar.push({
        date: dateStr,
        occupied,
        remaining: crowdInfo.remaining,
        capacity: crowdInfo.capacity,
        crowdLevel: crowdInfo.level,
        crowdLabel: crowdInfo.label,
        percentage: crowdInfo.percentage,
      });

      curr.setDate(curr.getDate() + 1);
    }

    return {
      message: 'Berhasil mengambil kalender keramaian destinasi',
      data: {
        destinationName: dest.name,
        slug: dest.slug,
        dailyVisitorLimit: dest.dailyVisitorLimit,
        calendar,
      },
    };
  }

  // 5. Ambil Daftar Capacity Overrides
  async getCapacityOverrides(destinationId?: string, userId?: string) {
    const dest = await this.findDestination(destinationId, userId);

    const overrides = await this.prisma.destinationCapacityOverride.findMany({
      where: { destinationId: dest.id }, // 👈 Fixed typo: destinationId
      orderBy: { overrideDate: 'asc' },
    });

    return {
      message: 'Berhasil mengambil daftar batas kuota khusus',
      data: overrides,
    };
  }

  // 6. Simpan / Update Capacity Override
  async upsertCapacityOverride(
    dto: CreateCapacityOverrideDto,
    destinationId?: string,
    userId?: string,
  ) {
    const dest = await this.findDestination(destinationId, userId);
    const dateObj = new Date(dto.overrideDate);

    const override = await this.prisma.destinationCapacityOverride.upsert({
      where: {
        destinationId_overrideDate: {
          destinationId: dest.id,
          overrideDate: dateObj,
        },
      },
      update: {
        dailyVisitorLimit: dto.dailyVisitorLimit,
        reason: dto.reason,
      },
      create: {
        destinationId: dest.id,
        overrideDate: dateObj,
        dailyVisitorLimit: dto.dailyVisitorLimit,
        reason: dto.reason,
      },
    });

    return {
      message: 'Berhasil menyimpan batas kuota khusus tanggal',
      data: override,
    };
  }

  // 7. Hapus Capacity Override
  async deleteCapacityOverride(
    id: string,
    destinationId?: string,
    userId?: string,
  ) {
    const dest = await this.findDestination(destinationId, userId);

    const override = await this.prisma.destinationCapacityOverride.findFirst({
      where: { id, destinationId: dest.id },
    });

    if (!override) {
      throw new NotFoundException('Data kuota khusus tidak ditemukan');
    }

    await this.prisma.destinationCapacityOverride.delete({
      where: { id },
    });

    return {
      message: 'Berhasil menghapus batas kuota khusus',
    };
  }
}