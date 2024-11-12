import { PaymentStatus } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string

  @IsOptional()
  @IsEnum(PaymentStatus)
  status: PaymentStatus = PaymentStatus.PENDING

  @IsOptional()
  @IsString()
  statusMessage: string = ''

  @IsString()
  @IsNotEmpty()
  paymentMethod: string
}
