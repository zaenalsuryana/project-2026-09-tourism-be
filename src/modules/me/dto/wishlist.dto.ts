import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddWishlistDto {
  @IsNotEmpty()
  @IsUUID(7)
  destinationId: string;
}