import { Controller, Post, Get, Body, Req, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator'; // 👈 Import decorator Public
import { MidtransNotificationDto } from './dto/midtrans-notification.dto';

@ApiTags('Orders & E-Tickets')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary:
      'Membuat pesanan tiket baru & Mendapatkan Link Pembayaran Midtrans',
  })
  @ApiBearerAuth()
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    // 1. Coba ambil dari req.user jika menggunakan Auth Guard
    let userId = req.user?.id || req.user?.userId || req.user?.sub;

    // 2. Jika req.user kosong TAPI user mengirimkan token di header (Opsional Auth)
    if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(
          Buffer.from(payloadBase64, 'base64').toString('utf8'),
        );

        userId =
          decodedPayload.userId || decodedPayload.sub || decodedPayload.id;
      } catch (error) {
        // Abaikan jika token invalid, pesanan tetap lanjut sebagai Guest
      }
    }

    return this.ordersService.create(createOrderDto, userId);
  }

  @Get()
  @ApiOperation({
    summary:
      'Melihat daftar pesanan (Mendukung filter userId, email, dan status)',
  })
  async findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  // === Route Webhook Ditaruh Sebelum Route Parameter :id ===
  @Public() // 👈 Mencegah JWT Auth Guard memblokir panggilan dari Server Midtrans
  @Post('midtrans-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook notifikasi otomatis dari Midtrans' })
  @ApiResponse({ status: 200, description: 'Notifikasi berhasil diproses' })
  async handleMidtransWebhook(@Body() payload: MidtransNotificationDto) {
    return this.ordersService.processMidtransNotification(payload);
  }

  // === 1. Route Validasi Tiket oleh Petugas ===
  @Post('validate-ticket')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifikasi / Scan QR Code Tiket oleh Petugas' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderCode: { type: 'string', example: 'WST-261016-A1B2C3' },
      },
      required: ['orderCode'],
    },
  })
  async validateTicket(@Body('orderCode') orderCode: string) {
    return this.ordersService.validateTicket(orderCode);
  }

  // === 2. Route Ambil E-Ticket (QR Code Base64) ===
  @Get(':id/ticket')
  @ApiOperation({
    summary:
      'Mendapatkan data E-Ticket beserta QR Code (Khusus status PAID)',
  })
  async getETicket(@Param('id') id: string) {
    return this.ordersService.getETicket(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Melihat detail satu pesanan berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Membatalkan pesanan dan mengembalikan kuota ticket',
  })
  async cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}