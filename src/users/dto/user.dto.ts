import { IsOptional, IsString, IsInt, IsUrl, IsEnum, IsArray, Min, Max, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User age', minimum: 18, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  age?: number;

  @ApiPropertyOptional({ description: 'User bio/description' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'User denomination' })
  @IsOptional()
  @IsEnum(Denomination)
  denomination?: Denomination;

  @ApiPropertyOptional({ description: 'User faith journey' })
  @IsOptional()
  @IsString()
  faithJourney?: string;

  @ApiPropertyOptional({ description: 'User favorite verse' })
  @IsOptional()
  @IsString()
  favoriteVerse?: string;

  @ApiPropertyOptional({ description: 'Location (city, state)' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional({ description: 'Field of study' })
  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @ApiPropertyOptional({ description: 'Profession' })
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional({ description: 'User hobbies' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hobbies?: string[];

  @ApiPropertyOptional({ description: 'User values' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];

  @ApiPropertyOptional({ description: 'User looking for' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lookingFor?: string[];

  @ApiPropertyOptional({ description: 'Primary profile photo (base64 or URL)' })
  @IsOptional()
  @IsString()
  profilePhoto1?: string;

  @ApiPropertyOptional({ description: 'Secondary profile photo (base64 or URL)' })
  @IsOptional()
  @IsString()
  profilePhoto2?: string;

  @ApiPropertyOptional({ description: 'Third profile photo (base64 or URL)' })
  @IsOptional()
  @IsString()
  profilePhoto3?: string;
}
export class UpdatePreferencesDto {
  @ApiPropertyOptional({ enum: Gender, description: 'Preferred gender' })
  @IsOptional()
  @IsEnum(Gender)
  preferredGender?: Gender;

  @ApiPropertyOptional({ 
    enum: Denomination, 
    isArray: true, 
    description: 'Preferred denominations' 
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Denomination, { each: true })
  preferredDenomination?: Denomination[];

  @ApiPropertyOptional({ description: 'Minimum age preference', minimum: 18 })
  @IsOptional()
  @IsInt()
  @Min(18)
  minAge?: number;

  @ApiPropertyOptional({ description: 'Maximum age preference', maximum: 100 })
  @IsOptional()
  @IsInt()
  @Max(100)
  maxAge?: number;

  @ApiPropertyOptional({ description: 'Maximum distance in miles', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDistance?: number;

  @ApiPropertyOptional({ 
    type: [String], 
    enum: ['GROWING', 'ROOTED', 'EXPLORING', 'PASSIONATE'],
    description: 'Preferred faith journey stages' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredFaithJourney?: string[];

  @ApiPropertyOptional({ 
    type: [String], 
    enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'OCCASIONALLY', 'RARELY'],
    description: 'Preferred church attendance frequencies' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredChurchAttendance?: string[];

  @ApiPropertyOptional({ 
    type: [String], 
    enum: ['FRIENDSHIP', 'RELATIONSHIP', 'MARRIAGE_MINDED'],
    description: 'Preferred relationship goals' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredRelationshipGoals?: string[];
}