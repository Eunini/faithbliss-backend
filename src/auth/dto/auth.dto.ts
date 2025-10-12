import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum Denomination {
  BAPTIST = 'BAPTIST',
  METHODIST = 'METHODIST',
  PRESBYTERIAN = 'PRESBYTERIAN',
  PENTECOSTAL = 'PENTECOSTAL',
  CATHOLIC = 'CATHOLIC',
  ORTHODOX = 'ORTHODOX',
  ANGLICAN = 'ANGLICAN',
  LUTHERAN = 'LUTHERAN',
  ASSEMBLIES_OF_GOD = 'ASSEMBLIES_OF_GOD',
  SEVENTH_DAY_ADVENTIST = 'SEVENTH_DAY_ADVENTIST',
  OTHER = 'OTHER',
}

export class RegisterDto {
  @ApiProperty({ example: 'john@faithbliss.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Emmanuel' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'MALE', enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: 'BAPTIST', enum: Denomination })
  @IsEnum(Denomination)
  denomination: Denomination;

  @ApiProperty({ example: 28, minimum: 18, maximum: 100 })
  @IsInt()
  @Min(18)
  @Max(100)
  age: number;

  @ApiProperty({ example: 'Lagos, Nigeria' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ 
    example: 'Passionate about serving God and looking for a faithful partner.',
    required: false 
  })
  @IsString()
  bio?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@faithbliss.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}