import { Controller, Post, Get, Body, Req, UseGuards, Query, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 


@ApiTags('Public - Orders (Checkout)')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Membuat pesanan tiket baru (Checkout)' })
  @ApiBearerAuth()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: any,
  ) {
    // 1. Coba ambil dari req.user jika suatu saat kamu pakai Global Guard
    let userId = req.user?.id || req.user?.userId || req.user?.sub; 

    // 2. Jika req.user kosong TAPI user mengirimkan token di header (Bypass untuk Opsional Auth)
    if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        // Ekstrak dan baca bagian payload JWT (bagian tengah)
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        
        // Sesuaikan dengan format payload JWT-mu
        userId = decodedPayload.userId || decodedPayload.sub || decodedPayload.id;
      } catch (error) {
        // Abaikan jika token rusak/salah, pesanan tetap lanjut sebagai Guest
      }
    }

    return this.ordersService.create(createOrderDto, userId);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Melihat daftar riwayat pesanan user yang sedang login' })
  @ApiBearerAuth()
  async getMyOrders(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId; 
    return this.ordersService.findByUserId(userId);
  }
  
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Melihat SEMUA pesanan atau cari berdasarkan email (Khusus Admin/Manager)' })
  @ApiBearerAuth()
  async getAllOrders(@Query('email') email?: string) { 
    return this.ordersService.findAll(email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Melihat detail satu pesanan berdasarkan ID (Bisa untuk Guest)'})
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}