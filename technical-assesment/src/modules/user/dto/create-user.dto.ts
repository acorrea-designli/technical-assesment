import { Roles } from '@commons/enums/roles.enum'
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @MinLength(8)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsEnum(Roles)
  @IsNotEmpty()
  role: Roles
}
