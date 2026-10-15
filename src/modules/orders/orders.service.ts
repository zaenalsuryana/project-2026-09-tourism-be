import { Injectable, NotFoundException, UnprocessableEntityException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

// Import SDK Midtrans
const midtransClient = require('midtrans-client');

@Injectable()
export class OrdersService {
  private snap: any;

  constructor(private readonly prisma: PrismaService) {
    // 1. Inisialisasi Midtrans Snap Instance
    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  }

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
    // 4. MEMULAI PRISMA TRANSACTION
    // =======================================================================
    try {
      const order = await this.prisma.$transaction(
        async (tx) => {
          // --- A. Pengecekan & Pengurangan Kuota ---
          const sortedItems = [...items].sort((a, b) => a.ticketTypeId.localeCompare(b.ticketTypeId));

          for (const item of sortedItems) {
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

            if (inv.length === 0) {
              throw new UnprocessableEntityException(`QUOTA_EXCEEDED: Kuota tiket untuk jenis tiket ID ${item.ticketTypeId} sudah habis di tanggal tersebut, atau jadwal inventori belum dibuka.`);
            }
          }

          // --- B. Persiapkan Data Pesanan ---
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
          
          // --- C. Simpan Order & Order Items (Expired 10 Menit) ---
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
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 menit
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

      // =======================================================================
      // 5. MINTA LINK PEMBAYARAN DARI MIDTRANS
      // =======================================================================
      const midtransParams = {
        transaction_details: {
          order_id: order.id,
          gross_amount: order.totalAmount,
        },
        customer_details: {
          first_name: order.buyerName,
          email: order.buyerEmail || 'no-email@example.com',
          phone: order.buyerPhone || '080000000000',
        },
      };

      const midtransTransaction = await this.snap.createTransaction(midtransParams);

      return {
        message: 'Pesanan berhasil dibuat!',
        data: order,
        paymentUrl: midtransTransaction.redirect_url, // URL untuk bayar via Midtrans
        paymentToken: midtransTransaction.token,
      };

    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw error; 
    }
  }

  async findAll(query: any) {
    const { userId, email, status } = query;
    const whereCondition: any = {};
    
    if (userId) {
      whereCondition.userId = userId;
    }
    if (email) {
      whereCondition.buyerEmail = { contains: email, mode: 'insensitive' };
    }
    if (status) {
      whereCondition.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where: whereCondition,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Berhasil mengambil daftar pesanan',
      data: orders,
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Pesanan dengan ID ${id} tidak ditemukan.`);
    }
    return {
      message: 'Berhasil mengambil detail pesanan',
      data: order,
    };
  }

  async processMidtransNotification(payload: any) {
    const orderId = payload.order_id;
    const transactionStatus = payload.transaction_status;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Pesanan tidak ditemukan',
        error: `Order ID ${orderId} dari Midtrans tidak ada di database kami.`
      });
    }

    // Perbaikan respons penolakan jika status bukan PENDING_PAYMENT
    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Pembayaran Ditolak',
        error: `Transaksi gagal diproses karena status pesanan saat ini adalah ${order.status}. Pembayaran hanya berlaku untuk status PENDING_PAYMENT.`
      });
    }

    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });
      return { message: 'Pembayaran berhasil dikonfirmasi via Midtrans' };
    } else if (transactionStatus === 'cancel' || transactionStatus === 'expire' || transactionStatus === 'deny') {
      await this.cancelOrder(orderId);
      return { message: 'Pembayaran gagal/kadaluarsa. Pesanan dibatalkan otomatis.' };
    }

    return { message: 'Status pembayaran diabaikan' };
  }

  async cancelOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Pesanan dengan ID ${id} tidak ditemukan.`);
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(`Pesanan tidak dapat dibatalkan karena status saat ini adalah ${order.status}.`);
    }

    try {
      const cancellerdOrder = await this.prisma.$transaction(async (tx) => {

        for (const item of order.items) {
          await tx.$queryRaw`
            UPDATE ticket_inventories
            SET sold = sold - ${item.quantity}, updated_at = now()
            WHERE ticket_type_id = ${item.ticketTypeId}::uuid
              AND date = ${order.visitDate}::date
          `;
        }

        return await tx.order.update({
          where: { id: id },
          data: { status: 'CANCELLED' },
        });
      });

      return {
        message: 'Pesanan berhasil dibatalkan dan kuota ticket telah dikembalikan.',
        data: cancellerdOrder,
      };

    } catch (error) {
      throw new UnprocessableEntityException('Gagal membatalkan pesanan dan mengembalikan kuota.');
    }
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }

  // Cron Job pembatalan pesanan kedaluwarsa setiap 1 menit
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronCancelExpiredOrders() {
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        expiresAt: { lt: new Date() },
      },
      include: { items: true },
    });

    if (expiredOrders.length === 0) return;

    console.log(`[CRON JOB] Ditemukan ${expiredOrders.length} pesanan kadaluarsa. Memulai pembatalan massal...`);

    for (const order of expiredOrders) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            await tx.$queryRaw`
              UPDATE ticket_inventories
              SET sold = sold - ${item.quantity}, updated_at = now()
              WHERE ticket_type_id = ${item.ticketTypeId}::uuid
                AND date = ${order.visitDate}::date
            `;
          }

          await tx.order.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' },
          });
        });

        console.log(`[CRON JOB] Berhasil membatalkan pesanan ${order.orderCode} (ID: ${order.id})`);
      } catch (error) {
        console.error(`[CRON JOB] Gagal membatalkan pesanan ${order.orderCode}:`, (error as Error).message);
      }
    }
  }
}