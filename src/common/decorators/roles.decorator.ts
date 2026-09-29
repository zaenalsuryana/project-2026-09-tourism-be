import { SetMetadata } from '@nestjs/common';
// Import menggunakan custom output Prisma
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);