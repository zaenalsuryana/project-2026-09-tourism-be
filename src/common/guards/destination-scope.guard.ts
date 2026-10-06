import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DestinationScopeGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const destination = await this.prisma.destination.findFirst({
      where: { managerId: user.sub },
    });

    if (!destination) {
      throw new ForbiddenException('Anda tidak memiliki akses ke destinasi manapun');
    }

    request.user.destinationId = destination.id;
    return true;
  }
}