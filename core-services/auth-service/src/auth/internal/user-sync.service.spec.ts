import { ConfigService } from '@nestjs/config';
import { UserSyncService } from './user-sync.service';
import { RequestContextService } from '../../common/request-context.service';

describe('UserSyncService', () => {
  let service: UserSyncService;
  let configService: ConfigService;
  let requestContext: RequestContextService;
  const payload = {
    id: 'user-1',
    email: 'ana@example.com',
    firstName: 'Ana',
    lastName: 'Gómez',
  };

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) =>
        key === 'USER_SERVICE_URL' ? 'http://localhost:3001' : undefined,
      ),
    } as unknown as ConfigService;
    requestContext = new RequestContextService();
    service = new UserSyncService(configService, requestContext);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips the call silently when USER_SERVICE_URL is not configured', async () => {
    (configService.get as jest.Mock).mockReturnValue(undefined);
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({} as Response);

    await service.notifyUserCreated(payload);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('POSTs the user payload to the internal endpoint', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 201 } as Response);

    await service.notifyUserCreated(payload);

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3001/internal/users',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }) as Record<string, string>,
        body: JSON.stringify(payload),
      }),
    );
  });

  it('tolerates a non-ok response from user-service', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(service.notifyUserCreated(payload)).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('tolerates a network failure without throwing', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.notifyUserCreated(payload)).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
