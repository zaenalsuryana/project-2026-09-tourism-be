import { Injectable, NotFoundException, UnprocessableEntityException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper function untuk generate Order Code (format WST-YYMMDD-XXXXXX)
  private generateOrderCode(): string {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    // Generate 6 karakter acak (huruf besar dan angka)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `WST-${yy}${mm}${dd}-${randomStr}`;
  }

  async create(createOrderDto: CreateOrderDto, userId?: string) {
    const { destinationId, visitDate, items, discountCode, buyer } = createOrderDto;
    const dateOfVisit = new Date(visitDate);

    // 1. Validasi Pembeli (Jika bukan user login, harus ada data buyer)
    if (!userId && (!buyer || !buyer.name || !buyer.email)) {
      throw new BadRequestException('Data pembeli (nama & email) wajib diisi untuk pengunjung tanpa akun.');
    }

    // 2. Ambil data Destinasi
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new UnprocessableEntityException('Destinasi tidak ditemukan.');
    }

    // 3. Ambil data Tiket yang ingin dibeli
    const ticketTypeIds = items.map((item) => item.ticketTypeId);
    const ticketTypes = await this.prisma.ticketType.findMany({
      where: {
        id: { in: ticketTypeIds },
        destinationId: destination.id,
        isActive: true,
      },
    });

    if (ticketTypes.length !== items.length) {
      throw new UnprocessableEntityException('Satu atau lebih jenis tiket tidak valid atau tidak aktif.');
    }

    // =======================================================================
    // 4. MEMULAI PRISMA TRANSACTION (Disusun sesuai skema aslimu)
    // =======================================================================
    try {
      const order = await this.prisma.$transaction(
        async (tx) => {
          // --- A. Pengecekan & Pengurangan Kuota (dari TicketInventory) ---
          // Urutkan item berdasarkan ID tiket untuk menghindari DB deadlock
          const sortedItems = [...items].sort((a, b) => a.ticketTypeId.localeCompare(b.ticketTypeId));

          for (const item of sortedItems) {
            // Karena skema aslimu belum ada 'reserved', kita langsung tambahkan ke 'sold'
            // Gunakan $queryRaw yang sudah disesuaikan dengan nama kolom 'date'
            const inv = await tx.$queryRaw<{ sold: number }[]>`
              UPDATE ticket_inventories ti
              SET sold = ti.sold + ${item.quantity}, updated_at = now()
              FROM ticket_types tt
              WHERE ti.ticket_type_id = ${item.ticketTypeId}::uuid
                AND ti.date = ${dateOfVisit}::date
                AND tt.id = ti.ticket_type_id
                AND (ti.quota IS NULL OR ti.sold + ${item.quantity} <= ti.quota)
              RETURNING ti.sold
            `;

            // Jika inv.length 0, artinya gagal update (bisa karena kuota habis, atau inventory belum di-create oleh Manager)
            if (inv.length === 0) {
              throw new UnprocessableEntityException(`QUOTA_EXCEEDED: Kuota tiket untuk jenis tiket ID ${item.ticketTypeId} sudah habis di tanggal tersebut, atau jadwal inventori belum dibuka.`);
            }
          }

          // --- B. Persiapkan Data Pesanan (Harga & Order Items) ---
          let subtotal = 0;
          const orderItemsData = items.map((item) => {
            const ticketDetail = ticketTypes.find((t) => t.id === item.ticketTypeId);
            const lineTotal = ticketDetail.price * item.quantity;
            subtotal += lineTotal;

            return {
              ticketTypeId: item.ticketTypeId,
              ticketName: ticketDetail.name, 
              unitPrice: ticketDetail.price,   
              quantity: item.quantity,
              discountAmount: 0, 
              lineTotal: lineTotal,
            };
          });

          const totalAmount = subtotal; 
          const orderCode = this.generateOrderCode();
          
          // --- C. Simpan Order & Order Items ---
          const newOrder = await tx.order.create({
            data: {
              orderCode: orderCode,
              destinationId: destination.id,
              userId: userId || null,
              buyerName: buyer?.name || 'Tamu',
              buyerEmail: buyer?.email || null,
              buyerPhone: buyer?.phone || null,
              visitDate: dateOfVisit,
              channel: 'ONLINE', 
              status: 'PENDING_PAYMENT',
              subtotal: subtotal,
              discountAmount: 0,
              serviceFee: 0,
              totalAmount: totalAmount,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000), 
              items: {
                create: orderItemsData,
              },
            },
            include: { items: true },
          });

          return newOrder;
        },
        { timeout: 10000 }
      );

      return {
        message: 'Pesanan berhasil dibuat!',
        data: order,
      };

    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw error; 
    }
  }

  async findByUserId(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId: userId },
      include: {
        items: true, 
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Berhasil mengambil riwayat pesanan',
      data: orders,
    };
  }

  async findAll(searchEmail?: string) {
    // Jika ada searchEmail, cari email itu. Jika tidak, tampilkan semua.
    const whereCondition = searchEmail ? { buyerEmail: searchEmail } : {};

    const orders = await this.prisma.order.findMany({
      where: whereCondition,
      include: {
        items: true, 
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: searchEmail ? `Hasil pencarian untuk ${searchEmail}` : 'Berhasil mengambil seluruh data pesanan',
      data: orders,
    };
  }

  findOne(id: string) {
    return `This action returns a #${id} order`;
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}