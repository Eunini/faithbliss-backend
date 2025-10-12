import { IsOptional, IsNumber, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DiscoverFiltersDto {
  @ApiPropertyOptional({ description: 'Maximum distance in kilometers' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxDistance?: number;

  @ApiPropertyOptional({ description: 'Minimum age' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAge?: number;

  @ApiPropertyOptional({ description: 'Maximum age' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxAge?: number;

  @ApiPropertyOptional({ description: 'Preferred denominations', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  denominations?: string[];

  @ApiPropertyOptional({ description: 'Interests to match', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Favorite verse to match' })
  @IsOptional()
  @IsString()
  verse?: string;

  @ApiPropertyOptional({ description: 'Show only online users' })
  @IsOptional()
  onlineOnly?: boolean;
}