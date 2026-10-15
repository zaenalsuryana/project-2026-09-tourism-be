import { Controller, Post, Get, Body, Req, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger'; // <-- ApiBody ditambahkan di sini

@ApiTags('Public - Orders (Checkout)')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Membuat pesanan tiket baru & Mendapatkan Link Pembayaran Midtrans' })
  @ApiBearerAuth()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: any,
  ) {
    // 1. Coba ambil dari req.user jika menggunakan Auth Guard
    let userId = req.user?.id || req.user?.userId || req.user?.sub; 

    // 2. Jika req.user kosong TAPI user mengirimkan token di header (Opsional Auth)
    if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        
        userId = decodedPayload.userId || decodedPayload.sub || decodedPayload.id;
      } catch (error) {
        // Abaikan jika token salah, pesanan tetap lanjut sebagai Guest
      }
    }

    return this.ordersService.create(createOrderDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Melihat daftar pesanan (Mendukung filter userId, email, dan status)' })
  async findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  // === Taruh Route Webhook sebelum Route dengan Parameter :id ===
  @Post('midtrans-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook notifikasi otomatis dari Midtrans' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', example: 'b576eabf-f61c-4bd5-bac2-a77939ed8b93' },
        transaction_status: { type: 'string', example: 'settlement' },
        gross_amount: { type: 'number', example: 25000 },
        payment_type: { type: 'string', example: 'bank_transfer' },
      },
    },
  })
  async handleMidtransWebhook(@Body() payload: any) {
    return this.ordersService.processMidtransNotification(payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Melihat detail satu pesanan berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Membatalkan pesanan dan mengembalikan kuota ticket' })
  async cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}