// Enhanced Auth DTO for comprehensive onboarding
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsInt, Min, Max, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';
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

export enum EducationLevel {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  BACHELORS = 'BACHELORS',
  MASTERS = 'MASTERS',
  PHD = 'PHD',
  VOCATIONAL = 'VOCATIONAL',
  OTHER = 'OTHER',
}

export enum ChurchAttendance {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  OCCASIONALLY = 'OCCASIONALLY',
  RARELY = 'RARELY',
}

export enum BaptismStatus {
  YES = 'YES',
  NO = 'NO',
  PLANNING = 'PLANNING',
}

export enum FaithJourney {
  GROWING = 'GROWING',
  ROOTED = 'ROOTED',
  EXPLORING = 'EXPLORING',
  PASSIONATE = 'PASSIONATE',
}

export enum RelationshipGoals {
  FRIENDSHIP = 'FRIENDSHIP',
  RELATIONSHIP = 'RELATIONSHIP',
  MARRIAGE_MINDED = 'MARRIAGE_MINDED',
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

  @ApiProperty({ example: 28, minimum: 18, maximum: 100 })
  @IsInt()
  @Min(18)
  @Max(100)
  age: number;

  @ApiProperty({ example: 'Lagos, Nigeria' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ example: 6.5244, description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 3.3792, description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'BAPTIST', enum: Denomination })
  @IsOptional()
  @IsEnum(Denomination)
  denomination?: Denomination;

  @ApiPropertyOptional({ example: 'BACHELORS', enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  education?: EducationLevel;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: 'WEEKLY', enum: ChurchAttendance })
  @IsOptional()
  @IsEnum(ChurchAttendance)
  churchAttendance?: ChurchAttendance;

  @ApiPropertyOptional({ example: 'YES', enum: BaptismStatus })
  @IsOptional()
  @IsEnum(BaptismStatus)
  baptismStatus?: BaptismStatus;

  @ApiPropertyOptional({ example: ['Teaching', 'Worship', 'Evangelism'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  spiritualGifts?: string[];

  @ApiPropertyOptional({ example: ['Reading', 'Hiking', 'Music'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ example: 'Marriage' })
  @IsOptional()
  @IsString()
  relationshipGoals?: string;

  @ApiPropertyOptional({ example: 'Non-smoker, social drinker' })
  @IsOptional()
  @IsString()
  lifestyle?: string;

  @ApiPropertyOptional({ 
    example: 'Passionate about serving God and looking for a faithful partner.',
    required: false 
  })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class OnboardingDto {
  // Basic Information
  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '+234' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: '1995-06-15' })
  @IsOptional()
  @IsString()
  birthday?: string;

  // Educational Background
  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  education?: EducationLevel;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  occupation?: string;

  // Location
  @ApiProperty({ example: 'Lagos, Nigeria' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ example: 6.5244 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 3.3792 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  // Faith Journey
  @ApiProperty({ enum: Denomination })
  @IsEnum(Denomination)
  denomination: Denomination;

  @ApiPropertyOptional({ enum: ChurchAttendance })
  @IsOptional()
  @IsEnum(ChurchAttendance)
  churchAttendance?: ChurchAttendance;

  @ApiPropertyOptional({ enum: BaptismStatus })
  @IsOptional()
  @IsEnum(BaptismStatus)
  baptismStatus?: BaptismStatus;

  @ApiPropertyOptional({ enum: FaithJourney })
  @IsOptional()
  @IsEnum(FaithJourney)
  faithJourney?: FaithJourney; // User's own faith journey

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  spiritualGifts?: string[];

  // Personal Preferences
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ type: [String], enum: RelationshipGoals })
  @IsOptional()
  @IsArray()
  @IsEnum(RelationshipGoals, { each: true })
  relationshipGoals?: RelationshipGoals[]; // User's own relationship goals

  @ApiPropertyOptional({ type: [String], example: ['Active', 'Social'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lifestyle?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'John 3:16' })
  @IsOptional()
  @IsString()
  favoriteVerse?: string;

  // Matching Preferences
  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  preferredGender?: Gender;

  @ApiPropertyOptional({ type: [String], enum: Denomination })
  @IsOptional()
  @IsArray()
  @IsEnum(Denomination, { each: true })
  preferredDenominations?: Denomination;

  @ApiPropertyOptional({ example: 18, minimum: 18 })
  @IsOptional()
  @IsInt()
  @Min(18)
  minAge?: number;

  @ApiPropertyOptional({ example: 50, minimum: 18 })
  @IsOptional()
  @IsInt()
  @Min(18)
  maxAge?: number;

  @ApiPropertyOptional({ example: 100, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDistance?: number;

  @ApiPropertyOptional({ type: [String], enum: FaithJourney })
  @IsOptional()
  @IsArray()
  @IsEnum(FaithJourney, { each: true })
  preferredFaithJourney?: FaithJourney[]; // What faith journey they want in matches

  @ApiPropertyOptional({ type: [String], enum: ChurchAttendance })
  @IsOptional()
  @IsArray()
  @IsEnum(ChurchAttendance, { each: true })
  preferredChurchAttendance?: ChurchAttendance[]; // What church attendance they want in matches

  @ApiPropertyOptional({ type: [String], enum: RelationshipGoals })
  @IsOptional()
  @IsArray()
  @IsEnum(RelationshipGoals, { each: true })
  preferredRelationshipGoals?: RelationshipGoals[]; // What relationship goals they want in matches
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
