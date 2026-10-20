import { Controller, Post, Get, Body, Req, Query, Param, HttpCode, HttpStatus, } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOnsiteOrderDto } from './dto/create-onsite-order.dto';
import { MidtransNotificationDto } from './dto/midtrans-notification.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Orders & E-Tickets')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // =========================================================================
  // 1. PEMBELIAN TIKET ONLINE (PUBLIC / TOURIST)
  // =========================================================================
  @Post()
  @ApiOperation({
    summary:
      'Membuat pesanan tiket baru & Mendapatkan Link Pembayaran Midtrans',
  })
  @ApiBearerAuth()
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    let userId = req.user?.id || req.user?.userId || req.user?.sub;

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

  // =========================================================================
  // 2. PENJUALAN TIKET LOKET / ONSITE (MANAGER / STAFF)
  // =========================================================================
  @Post('staff/onsite-orders')
  @ApiOperation({
    summary: 'Penjualan tiket loket / onsite (Khusus Manager & Staff)',
  })
  @ApiBearerAuth()
  async createOnsiteOrder(
    @Body() dto: CreateOnsiteOrderDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    const destinationId = req.user?.destinationId;

    return this.ordersService.createOnsiteOrder(
      dto,
      userId,
      destinationId,
    );
  }

  // =========================================================================
  // 3. DAFTAR PESANAN
  // =========================================================================
  @Get()
  @ApiOperation({
    summary:
      'Melihat daftar pesanan (Mendukung filter userId, email, dan status)',
  })
  async findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  // =========================================================================
  // 4. WEBHOOK MIDTRANS
  // =========================================================================
  @Public()
  @Post('midtrans-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook notifikasi otomatis dari Midtrans' })
  @ApiResponse({ status: 200, description: 'Notifikasi berhasil diproses' })
  async handleMidtransWebhook(@Body() payload: MidtransNotificationDto) {
    return this.ordersService.processMidtransNotification(payload);
  }

  // =========================================================================
  // 5. VALIDASI / SCAN TIKET PETUGAS
  // =========================================================================
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

  // =========================================================================
  // 6. AMBIL E-TICKET (QR CODE BASE64)
  // =========================================================================
  @Get(':id/ticket')
  @ApiOperation({
    summary:
      'Mendapatkan data E-Ticket beserta QR Code (Khusus status PAID)',
  })
  async getETicket(@Param('id') id: string) {
    return this.ordersService.getETicket(id);
  }

  // =========================================================================
  // 7. DETAIL PESANAN
  // =========================================================================
  @Get(':id')
  @ApiOperation({ summary: 'Melihat detail satu pesanan berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // =========================================================================
  // 8. BATALKAN PESANAN
  // =========================================================================
  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Membatalkan pesanan dan mengembalikan kuota ticket',
  })
  async cancelOrder(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}