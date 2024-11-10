import { Test, TestingModule } from '@nestjs/testing';
import { PasswordManagerService } from './password-manager.service';

describe('PasswordManagerService', () => {
  let service: PasswordManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordManagerService],
    }).compile();

    service = module.get<PasswordManagerService>(PasswordManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password', async () => {
    const password = 'password';
    const hashedPassword = await service.hashPassword(password);

    expect(hashedPassword).not.toEqual(password);
  });

  it('should compare password', async () => {
    const password = 'password';
    const hashedPassword = await service.hashPassword(password);

    const isMatch = await service.comparePassword(password, hashedPassword);

    expect(isMatch).toBe(true);
  });

  it('should not compare password', async () => {
    const password = 'password';
    const hashedPassword = await service.hashPassword(password);

    const isMatch = await service.comparePassword('wrongPassword', hashedPassword);

    expect(isMatch).toBe(false);
  });
});
