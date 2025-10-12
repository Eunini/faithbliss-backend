import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PostType {
  POST = 'POST',
  VERSE = 'VERSE',
  TESTIMONY = 'TESTIMONY'
}

export class CreateCommunityPostDto {
  @ApiProperty({ description: 'Post content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Post type', enum: PostType })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiPropertyOptional({ description: 'Bible verse reference for verse posts' })
  @IsOptional()
  @IsString()
  verse?: string;
}

export class CreatePostCommentDto {
  @ApiProperty({ description: 'Comment content' })
  @IsString()
  content: string;
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Event type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Event date and time' })
  @IsString()
  date: string;

  @ApiProperty({ description: 'Event time' })
  @IsString()
  time: string;

  @ApiPropertyOptional({ description: 'Event location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Is virtual event' })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional({ description: 'Maximum attendees' })
  @IsOptional()
  maxAttendees?: number;
}

export class CreatePrayerRequestDto {
  @ApiProperty({ description: 'Prayer request content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Post anonymously' })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class CreateBlessWallEntryDto {
  @ApiProperty({ description: 'User ID to bless' })
  @IsString()
  toUserId: string;

  @ApiProperty({ description: 'Blessing message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Bible verse' })
  @IsOptional()
  @IsString()
  verse?: string;

  @ApiPropertyOptional({ description: 'Make blessing public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}