import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
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
}