import {
  IsEmail,
  IsString,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @Length(1, 100)
  first_name: string;

  @IsString()
  @Length(1, 100)
  last_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-().]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone?: string;
}
