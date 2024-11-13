import { Expose } from 'class-transformer'
import { Order } from '../order/entities/order.entity'
import { Payment } from '../payment/entities/payment.entity'

export class OrderWithPayment extends Order {
  @Expose()
  payments: Payment[]

  @Expose()
  price: number
}
