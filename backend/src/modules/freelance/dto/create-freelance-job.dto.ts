import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateFreelanceJobDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNumber()
  budgetMin: number;

  @IsNumber()
  budgetMax: number;

  @IsOptional()
  @IsString()
  pricingType?: string;

  @IsNumber()
  deadlineDays: number;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsOptional()
  @IsString()
  locationPreference?: string;

  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
