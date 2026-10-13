import { Controller, Post, Body, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
// import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public - Orders (Checkout)')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // @Public() // Buka komentar ini jika kamu menggunakan JWT Guard secara global di main.ts
  @Post()
  @ApiOperation({ summary: 'Membuat pesanan tiket baru (Checkout)' })
  @ApiBearerAuth() // Opsional, karena pengunjung tanpa login juga bisa beli
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: any,
  ) {
    // Ambil user ID jika pembeli sedang login (dari token JWT)
    // Jika tidak login (Tamu), userId akan bernilai undefined
    const userId = req.user?.id; 

    return this.ordersService.create(createOrderDto, userId);
  }
}