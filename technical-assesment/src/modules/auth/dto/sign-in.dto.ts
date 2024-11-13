import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator'

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  password: string
}
