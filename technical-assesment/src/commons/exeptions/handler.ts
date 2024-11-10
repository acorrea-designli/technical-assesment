import { HttpException, Logger } from '@nestjs/common'

export class ExceptionHandler {
  static handle(error, logger: Logger) {
    logger.error(error)
    if (error instanceof HttpException) throw error
    throw new HttpException('Internal server error', 500)
  }
}
