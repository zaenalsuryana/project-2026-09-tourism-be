import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NavigationsService {
  private readonly logger = new Logger(NavigationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async calculateRoute(destinationId: string, userLat: number, userLng: number) {
    // 1. Validasi input koordinat user
    if (!userLat || !userLng || isNaN(userLat) || isNaN(userLng)) {
      throw new BadRequestException('Koordinat latitude dan longitude pengguna (user) wajib dikirim dengan format angka yang valid.');
    }

    // 2. Ambil koordinat destinasi dari database
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      select: { name: true, latitude: true, longitude: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan.');
    }

    if (!destination.latitude || !destination.longitude) {
      throw new BadRequestException('Koordinat destinasi ini belum disetel di database.');
    }

    const destLat = Number(destination.latitude);
    const destLng = Number(destination.longitude);

    try {
      // 3. Tembak API OSRM (Open Source Routing Machine)
      // Format URL OSRM: longitude,latitude
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=false`;
      
      const response = await firstValueFrom(this.httpService.get(osrmUrl));
      const data = response.data;

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('Rute tidak ditemukan oleh OSRM');
      }

      const route = data.routes[0];
      
      // Kalkulasi jarak dan waktu (OSRM merespons distance dalam meter, duration dalam detik)
      const distanceKm = (route.distance / 1000).toFixed(2); 
      const durationMinutes = Math.ceil(route.duration / 60);

      return {
        message: 'Rute berhasil dihitung',
        data: {
          destinationName: destination.name,
          origin: { lat: userLat, lng: userLng },
          destination: { lat: destLat, lng: destLng },
          distanceKm: Number(distanceKm),
          estimatedDurationMinutes: durationMinutes,
          // URL ini bisa dipakai tombol "Arahkan Saya" di Frontend buat langsung buka Google Maps App
          googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`
        }
      };
    } catch (error) {
      this.logger.error(`Gagal menghitung rute OSRM: ${(error as Error).message}`);
      throw new BadRequestException('Gagal menghitung jarak dan rute ke destinasi. Pastikan koordinat yang Anda masukkan tidak di tengah lautan.');
    }
  }
}