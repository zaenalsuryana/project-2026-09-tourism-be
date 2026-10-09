import { PartialType } from '@nestjs/swagger';
import { CreateTicketInventoryDto } from './create-ticket-inventory.dto';

export class UpdateTicketInventoryDto extends PartialType(CreateTicketInventoryDto) {}