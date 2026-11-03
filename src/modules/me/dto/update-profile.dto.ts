import { IsOptional, IsString, IsDateString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(3, 120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  city?: string;
}