import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsUUID()
  otherUserId: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  contractId?: string;
}
