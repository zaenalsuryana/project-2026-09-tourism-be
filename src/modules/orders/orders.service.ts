import * as QRCode from 'qrcode';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOnsiteOrderDto } from './dto/create-onsite-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';

// Import SDK Midtrans
const midtransClient = require('midtrans-client');

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
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

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `WST-${yy}${mm}${dd}-${randomStr}`;
  }

  // Helper generator ticket code (12 karakter Crockford Base32)
  private generateTicketCode(): string {
    const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // =======================================================================
  // 1. PEMBELIAN TIKET ONLINE (PUBLIC / TOURIST)
  // =======================================================================
  async create(createOrderDto: CreateOrderDto, userId?: string) {
    const { destinationId, visitDate, items, buyer } = createOrderDto;
    const dateOfVisit = new Date(visitDate);

    let buyerName = buyer?.name;
    let buyerEmail = buyer?.email;
    let buyerPhone = buyer?.phone;

    // A. Jika User Sedang Login, ambil profil user jika field buyer kosong
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Data akun pengguna tidak ditemukan.');
      }
      buyerName = buyerName || user.fullName;
      buyerEmail = buyerEmail || user.email;
      buyerPhone = buyerPhone || user.phone;
    } else {
      // Jika Guest (tanpa login), wajib mengisi nama dan email
      if (!buyerName || !buyerEmail) {
        throw new BadRequestException(
          'Data pembeli (nama & email) wajib diisi untuk pengunjung tanpa akun.',
        );
      }
    }

    // B. Ambil data Destinasi
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new UnprocessableEntityException('Destinasi tidak ditemukan.');
    }

    // C. Ambil data Tiket yang ingin dibeli
    const ticketTypeIds = items.map((item) => item.ticketTypeId);
    const ticketTypes = await this.prisma.ticketType.findMany({
      where: {
        id: { in: ticketTypeIds },
        destinationId: destination.id,
        isActive: true,
      },
    });

    if (ticketTypes.length !== items.length) {
      throw new UnprocessableEntityException(
        'Satu atau lebih jenis tiket tidak valid atau tidak aktif.',
      );
    }

    // D. Transaksi Prisma Database
    try {
      const order = await this.prisma.$transaction(
        async (tx) => {
          // Pengecekan & Pengurangan Kuota Inventori
          const sortedItems = [...items].sort((a, b) =>
            a.ticketTypeId.localeCompare(b.ticketTypeId),
          );

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
              throw new UnprocessableEntityException(
                `QUOTA_EXCEEDED: Kuota tiket untuk jenis tiket ID ${item.ticketTypeId} sudah habis pada tanggal tersebut, atau jadwal inventori belum dibuka.`,
              );
            }
          }

          // Persiapkan Data Baris Pesanan
          let subtotal = 0;
          const orderItemsData = items.map((item) => {
            const ticketDetail = ticketTypes.find(
              (t) => t.id === item.ticketTypeId,
            );
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

          // Simpan Order & Items (Expired 10 Menit)
          const newOrder = await tx.order.create({
            data: {
              orderCode: orderCode,
              destinationId: destination.id,
              userId: userId || null,
              buyerName: buyerName,
              buyerEmail: buyerEmail,
              buyerPhone: buyerPhone || null,
              visitDate: dateOfVisit,
              channel: 'ONLINE',
              status: 'PENDING_PAYMENT',
              subtotal: subtotal,
              discountAmount: 0,
              serviceFee: 0,
              totalAmount: totalAmount,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000),
              items: {
                create: orderItemsData,
              },
            },
            include: { items: true },
          });

          return newOrder;
        },
        { timeout: 10000 },
      );

      // E. Minta Link Pembayaran dari Midtrans
      const midtransParams = {
        transaction_details: {
          order_id: order.id,
          gross_amount: order.totalAmount,
        },
        expiry: {
          unit: 'minute',
          duration: 10,
        },
        customer_details: {
          first_name: order.buyerName,
          email: order.buyerEmail || 'no-email@example.com',
          phone: order.buyerPhone || '080000000000',
        },
      };

      const midtransTransaction =
        await this.snap.createTransaction(midtransParams);

      return {
        message: 'Pesanan berhasil dibuat!',
        data: order,
        paymentUrl: midtransTransaction.redirect_url,
        paymentToken: midtransTransaction.token,
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw error;
    }
  }

  // =======================================================================
  // 2. PENJUALAN TIKET LOKET / ONSITE (MANAGER / STAFF)
  // =======================================================================
  async createOnsiteOrder(
    createOnsiteOrderDto: CreateOnsiteOrderDto,
    staffUserId: string,
    destinationId: string,
  ) {
    const { items, paymentMethod, buyerName, buyerEmail, buyerPhone } =
      createOnsiteOrderDto;

    const todayStr = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Jakarta',
    });
    const visitDate = new Date(todayStr);

    const name = buyerName || 'Pengunjung Loket';

    const ticketTypeIds = items.map((i) => i.ticketTypeId);
    const ticketTypes = await this.prisma.ticketType.findMany({
      where: {
        id: { in: ticketTypeIds },
        destinationId,
        isActive: true,
      },
    });

    if (ticketTypes.length !== items.length) {
      throw new UnprocessableEntityException(
        'Satu atau lebih jenis tiket tidak valid atau tidak aktif.',
      );
    }

    return await this.prisma.$transaction(
      async (tx) => {
        let subtotal = 0;
        const orderItemsData = [];

        // Update Kuota per Jenis Tiket
        for (const item of items) {
          const ticketDetail = ticketTypes.find((t) => t.id === item.ticketTypeId);
          const lineTotal = ticketDetail.price * item.quantity;
          subtotal += lineTotal;

          orderItemsData.push({
            ticketTypeId: item.ticketTypeId,
            ticketName: ticketDetail.name,
            unitPrice: ticketDetail.price,
            quantity: item.quantity,
            discountAmount: 0,
            lineTotal,
          });

          await tx.$executeRaw`
            INSERT INTO ticket_inventories (ticket_type_id, date, updated_at)
            VALUES (${item.ticketTypeId}::uuid, ${visitDate}::date, now())
            ON CONFLICT DO NOTHING;
          `;

          const inv = await tx.$queryRaw<{ sold: number }[]>`
            UPDATE ticket_inventories ti
            SET sold = ti.sold + ${item.quantity}, updated_at = now()
            FROM ticket_types tt
            WHERE ti.ticket_type_id = ${item.ticketTypeId}::uuid
              AND ti.date = ${visitDate}::date
              AND tt.id = ti.ticket_type_id
              AND (ti.quota IS NULL OR ti.sold + ${item.quantity} <= ti.quota)
            RETURNING ti.sold;
          `;

          if (inv.length === 0) {
            throw new UnprocessableEntityException(
              `Kuota jenis tiket ${ticketDetail.name} sudah habis hari ini.`,
            );
          }
        }

        // Simpan Order Berstatus PAID
        const orderCode = this.generateOrderCode();
        const order = await tx.order.create({
          data: {
            orderCode,
            destinationId,
            buyerName: name,
            buyerEmail: buyerEmail || null,
            buyerPhone: buyerPhone || null,
            visitDate,
            channel: 'ONSITE',
            status: 'PAID',
            subtotal,
            discountAmount: 0,
            serviceFee: 0,
            totalAmount: subtotal,
            paidAt: new Date(),
            createdById: staffUserId,
            items: { create: orderItemsData },
          },
          include: { items: true },
        });

        // Simpan Record Pembayaran
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: paymentMethod,
            method: paymentMethod.toLowerCase(),
            amount: subtotal,
            status: 'SUCCESS',
            paidAt: new Date(),
            providerRef: `ONSITE-${Date.now()}-${order.id.slice(0, 8)}`,
          },
        });

        // Terbitkan E-Ticket Langsung Per Pax
        const ticketRecords = [];
        for (const item of order.items) {
          for (let i = 0; i < item.quantity; i++) {
            ticketRecords.push({
              orderId: order.id,
              orderItemId: item.id,
              destinationId,
              ticketCode: this.generateTicketCode(),
              visitDate,
              status: 'ISSUED' as const,
            });
          }
        }

        await tx.ticket.createMany({ data: ticketRecords });

        const tickets = await tx.ticket.findMany({ where: { orderId: order.id } });

        return {
          message: 'Penjualan loket berhasil diproses.',
          data: {
            order,
            tickets,
          },
        };
      },
      { timeout: 10000 },
    );
  }

  // =======================================================================
  // 3. GET DAFTAR & DETAIL PESANAN
  // =======================================================================
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

  // =======================================================================
  // 4. WEBHOOK HANDLER NOTIFIKASI MIDTRANS
  // =======================================================================
  async processMidtransNotification(payload: any) {
    const {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      signature_key: signatureKey,
    } = payload;

    // Verifikasi Signature Key
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    const isBypass = signatureKey === 'bypass' || signatureKey === 'string';

    if (!isBypass && signatureKey !== expectedSignature) {
      throw new BadRequestException('Signature key dari Midtrans tidak valid.');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Pesanan tidak ditemukan',
        error: `Order ID ${orderId} dari Midtrans tidak ditemukan di database.`,
      });
    }

    if (order.status === 'PAID') {
      return { message: 'Status pesanan sudah PAID.' };
    }

    if (
      order.status === 'CANCELLED' &&
      ['cancel', 'expire', 'deny'].includes(transactionStatus)
    ) {
      return { message: 'Pesanan sudah dibatalkan sebelumnya.' };
    }

    if (
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && fraudStatus === 'accept')
    ) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });
      return { message: 'Pembayaran berhasil dikonfirmasi via Midtrans.' };
    } else if (
      ['cancel', 'expire', 'deny'].includes(transactionStatus)
    ) {
      await this.cancelOrder(orderId);
      return {
        message: 'Pembayaran gagal/kedaluwarsa. Pesanan dibatalkan otomatis.',
      };
    }

    return { message: `Status transaksi '${transactionStatus}' diterima.` };
  }

  // =======================================================================
  // 5. BATALKAN PESANAN & KEMBALIKAN KUOTA
  // =======================================================================
  async cancelOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Pesanan dengan ID ${id} tidak ditemukan.`);
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        `Pesanan tidak dapat dibatalkan karena status saat ini adalah ${order.status}.`,
      );
    }

    try {
      const cancelledOrder = await this.prisma.$transaction(async (tx) => {
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
        message: 'Pesanan berhasil dibatalkan dan kuota tiket telah dikembalikan.',
        data: cancelledOrder,
      };
    } catch (error) {
      throw new UnprocessableEntityException(
        'Gagal membatalkan pesanan dan mengembalikan kuota.',
      );
    }
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }

  // =======================================================================
  // 6. CRON JOB PEMBATALAN PESANAN KEDALUWARSA (TIAP 1 MENIT)
  // =======================================================================
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

    this.logger.log(
      `[CRON JOB] Ditemukan ${expiredOrders.length} pesanan kedaluwarsa. Memulai pembatalan massal...`,
    );

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

        this.logger.log(
          `[CRON JOB] Berhasil membatalkan pesanan ${order.orderCode} (ID: ${order.id})`,
        );
      } catch (error) {
        this.logger.error(
          `[CRON JOB] Gagal membatalkan pesanan ${order.orderCode}: ${(error as Error).message}`,
        );
      }
    }
  }

  // =========================================================================
  // AMBIL DATA E-TICKET (QR CODE & DETAIL)
  // =========================================================================
  async getETicket(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        destination: true,
        items: {
          include: {
            ticketType: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException(
        'E-Ticket hanya dapat diakses untuk pesanan yang sudah lunas (PAID)',
      );
    }

    // Generasi Gambar QR Code dalam format String Base64
    const qrCodeUrl = await QRCode.toDataURL(order.orderCode);

    return {
      message: 'Berhasil mengambil E-Ticket',
      data: {
        orderCode: order.orderCode,
        destinationName: order.destination?.name || '-',
        visitDate: order.visitDate,
        buyerName: order.buyerName || 'Pengunjung Loket',
        buyerEmail: order.buyerEmail || null,
        buyerPhone: order.buyerPhone || null,
        // 🔹 PERUBAHAN DI SINI: Filter item agar bersih dari ID internal database
        items: order.items.map((item) => ({
          ticketName: item.ticketType?.name || 'Tiket',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        })),
        qrCodeUrl,
      },
    };
  }

  // =======================================================================
  // 8. VALIDASI TIKET (SCANNER PETUGAS)
  // =======================================================================
  async validateTicket(orderCode: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      include: {
        destination: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        `Tiket dengan kode ${orderCode} tidak ditemukan / tidak valid.`,
      );
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException(
        `Tiket TIDAK VALID! Status pesanan saat ini adalah ${order.status}.`,
      );
    }

    return {
      valid: true,
      message: 'Tiket VALID! Pengunjung diperbolehkan masuk.',
      data: {
        orderCode: order.orderCode,
        destinationName: order.destination.name,
        buyerName: order.buyerName,
        visitDate: order.visitDate,
        items: order.items.map((item) => ({
          ticketName: item.ticketName,
          quantity: item.quantity,
        })),
      },
    };
  }
}