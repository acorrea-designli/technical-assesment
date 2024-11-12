import { OnEvent } from '@nestjs/event-emitter'
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'

import { Server } from 'socket.io'

@WebSocketGateway()
export class OrderManagerGateway {
  @WebSocketServer()
  server: Server

  @OnEvent('order.updated')
  onOrderUpdated(data: { userId: string; orderId: string; status: string; statusMessage: string }) {
    this.server.emit(`${data.userId}`, { ...data, type: 'order.updated' })
  }

  @OnEvent('payment.updated')
  onPaymentUpdated(data: { userId: string; orderId: string; status: string; statusMessage: string }) {
    this.server.emit(`${data.userId}`, { ...data, type: 'payment.updated' })
  }
}
