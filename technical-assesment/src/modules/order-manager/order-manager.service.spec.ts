import { Test, TestingModule } from '@nestjs/testing';
import { OrderManagerService } from './order-manager.service';

describe('OrderManagerService', () => {
  let service: OrderManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderManagerService],
    }).compile();

    service = module.get<OrderManagerService>(OrderManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
